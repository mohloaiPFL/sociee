import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import api from "../services/Api";

jest.mock("../services/Api", () => ({
  __esModule: true,
  default: {
    defaults: { baseURL: "http://localhost:5000/api" },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
  URL.createObjectURL = jest.fn(() => "blob:profile-preview");
  URL.revokeObjectURL = jest.fn();
  api.get.mockImplementation(path => Promise.resolve({
    data: path === "/profile/me"
      ? { name: "Alex Creator", bio: "Creator bio", profileImage: "" }
      : { totalContent: 0 }
  }));
});

test("uploads and saves a creator profile picture and profile details", async () => {
  api.post.mockResolvedValue({
    data: { files: [{ url: "/api/media/uploaded-profile-image" }] }
  });
  api.put.mockResolvedValue({
    data: {
      profile: {
        name: "Alex Updated",
        bio: "Updated bio",
        profileImage: "http://localhost:5000/api/media/uploaded-profile-image"
      }
    }
  });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Dashboard />
    </MemoryRouter>
  );

  fireEvent.change(await screen.findByLabelText("Display name"), {
    target: { value: "Alex Updated" }
  });
  fireEvent.change(screen.getByLabelText("Bio"), {
    target: { value: "Updated bio" }
  });
  fireEvent.change(screen.getByLabelText("Profile picture"), {
    target: {
      files: [new File(["image"], "profile.png", { type: "image/png" })]
    }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

  await waitFor(() => expect(api.put).toHaveBeenCalledWith("/profile/me", {
    displayName: "Alex Updated",
    bio: "Updated bio",
    profileImage: "http://localhost:5000/api/media/uploaded-profile-image"
  }));
  expect(api.post).toHaveBeenCalledWith("/media/upload", expect.any(FormData));
  expect(await screen.findByRole("status")).toHaveTextContent("Profile saved successfully.");
});
