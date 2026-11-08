import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CreatorProfile from "./CreatorProfile";
import api from "../services/Api";

jest.mock("../services/Api", () => ({
  __esModule: true,
  default: {
    defaults: { baseURL: "http://localhost:5000/api" },
    get: jest.fn()
  }
}));

test("shows the creator profile, published post, engagement counts, and post link", async () => {
  api.get.mockResolvedValue({
    data: {
      profile: {
        id: "creator-1",
        name: "Alex Creator",
        bio: "Sharing weekly lessons.",
        profileImage: "/api/media/avatar"
      },
      posts: [{
        _id: "post-1",
        title: "First post",
        description: "A useful tutorial",
        contentType: "image",
        thumbnail: "/api/media/post-image",
        category: "Education",
        likesCount: 12,
        commentsCount: 4
      }]
    }
  });

  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={["/creator/creator-1"]}
    >
      <Routes>
        <Route path="/creator/:creatorId" element={<CreatorProfile />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByRole("heading", { name: "Alex Creator" })).toBeInTheDocument();
  expect(screen.getByText("Sharing weekly lessons.")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Alex Creator profile" })).toHaveAttribute(
    "src",
    "http://localhost:5000/api/media/avatar"
  );
  expect(screen.getByRole("heading", { name: "First post" })).toBeInTheDocument();
  expect(screen.getByText(/12 likes/i)).toBeInTheDocument();
  expect(screen.getByText(/4 comments/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /view post & comments/i })).toHaveAttribute(
    "href",
    "/content/post-1"
  );
});
