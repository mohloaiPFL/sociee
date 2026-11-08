import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ManageContent from "./Managecontent";
import api from "../services/Api";

jest.mock("../services/Api", () => ({
  __esModule: true,
  default: {
    defaults: { baseURL: "http://localhost:5000/api" },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  jest.clearAllMocks();
  URL.createObjectURL = jest.fn(() => "blob:media-preview");
  URL.revokeObjectURL = jest.fn();
  api.get.mockResolvedValue({ data: [] });
});

afterAll(() => {
  if (originalCreateObjectURL) URL.createObjectURL = originalCreateObjectURL;
  else delete URL.createObjectURL;
  if (originalRevokeObjectURL) URL.revokeObjectURL = originalRevokeObjectURL;
  else delete URL.revokeObjectURL;
});

test("uploads a selected phone photo before saving its content record", async () => {
  api.post
    .mockResolvedValueOnce({
      data: { files: [{ url: "/api/media/0123456789abcdef01234567" }] }
    })
    .mockResolvedValueOnce({ data: { content: { _id: "content-id" } } });

  render(<ManageContent />);

  fireEvent.change(screen.getByPlaceholderText(/enter title/i), {
    target: { value: "A photo post" }
  });
  fireEvent.change(screen.getByPlaceholderText(/describe your content/i), {
    target: { value: "Posted from my device" }
  });
  fireEvent.change(screen.getByDisplayValue("Video"), {
    target: { value: "image" }
  });
  fireEvent.change(document.querySelector('input[type="file"]'), {
    target: {
      files: [new File(["photo"], "phone-photo.png", { type: "image/png" })]
    }
  });

  expect(await screen.findByAltText(/preview of phone-photo.png/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /save content/i }));

  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
  expect(api.post.mock.calls[0][0]).toBe("/media/upload");
  expect(api.post.mock.calls[0][1].get("files")).toBeInstanceOf(File);
  expect(api.post.mock.calls[1][0]).toBe("/contents");
  expect(api.post.mock.calls[1][1]).toMatchObject({
    title: "A photo post",
    contentType: "image",
    mediaUrls: ["http://localhost:5000/api/media/0123456789abcdef01234567"],
    mediaUrl: "http://localhost:5000/api/media/0123456789abcdef01234567",
    thumbnail: "http://localhost:5000/api/media/0123456789abcdef01234567"
  });
});
