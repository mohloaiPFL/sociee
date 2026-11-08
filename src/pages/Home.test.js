import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import api from "../services/Api";

jest.mock("../services/Api", () => ({
  __esModule: true,
  default: {
    defaults: { baseURL: "http://localhost:5000/api" },
    get: jest.fn()
  }
}));

afterEach(() => {
  jest.restoreAllMocks();
});

test("shows the creator introduction, profile picture, featured content, and post time", async () => {
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-06T12:00:00.000Z"));
  api.get.mockImplementation(path => {
    if (path === "/contents") {
      return Promise.resolve({
        data: [{
          _id: "content-1",
          title: "A new post",
          description: "Post description",
          category: "Education",
          contentType: "image",
          thumbnail: "https://example.com/post.jpg",
          creator: {
            id: "creator-1",
            name: "Alex Creator",
            bio: "Sharing useful lessons every week.",
            profileImage: "/api/media/profile-image"
          },
          publicationDate: "2026-11-06T10:00:00.000Z",
          likesCount: 2
        }]
      });
    }
    return Promise.resolve({ data: {} });
  });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Home />
    </MemoryRouter>
  );

  expect(await screen.findAllByText("Alex Creator")).toHaveLength(3);
  expect(screen.getByRole("heading", { name: "Welcome to Sociee" })).toBeInTheDocument();
  expect(screen.getByText("Sharing useful lessons every week.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Featured Content" })).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { name: "A new post" })).toHaveLength(2);
  expect(screen.getAllByText("2h ago")).toHaveLength(2);
  expect(screen.getAllByRole("img", { name: "Alex Creator profile" })[0]).toHaveAttribute(
    "src",
    "http://localhost:5000/api/media/profile-image"
  );
  expect(screen.getAllByRole("link", { name: "View Alex Creator's profile" })[0]).toHaveAttribute(
    "href",
    "/creator/creator-1"
  );
});

test("shows a Sociee logo when no creator profile picture is available", async () => {
  api.get.mockImplementation(path => Promise.resolve({
    data: path === "/contents"
      ? [{ _id: "content-2", title: "Featured", description: "", creator: { name: "Alex" } }]
      : { name: "Alex", bio: "Creator introduction" }
  }));

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Home />
    </MemoryRouter>
  );

  expect(await screen.findByRole("img", { name: "Alex logo" })).toHaveTextContent("S");
  expect(screen.getByText("Creator introduction")).toBeInTheDocument();
});
