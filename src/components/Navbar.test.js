import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";
import api from "../services/Api";

jest.mock("../services/Api", () => ({
  __esModule: true,
  default: {
    defaults: { baseURL: "http://localhost:5000/api" },
    get: jest.fn()
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test("shows the public creator profile beside creator login", async () => {
  api.get.mockResolvedValue({
    data: [{
      creator: {
        id: "creator-1",
        name: "Alex Creator",
        profileImage: "/api/media/avatar"
      }
    }]
  });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
    </MemoryRouter>
  );

  const creatorLink = await screen.findByRole("link", { name: "Creator profile: Alex Creator" });
  expect(creatorLink).toHaveAttribute("href", "/creator/creator-1");
  expect(creatorLink.querySelector("img")).toHaveAttribute(
    "src",
    "http://localhost:5000/api/media/avatar"
  );
  expect(creatorLink.previousElementSibling).toHaveTextContent("Creator login");
});

test("shows the signed-in creator profile and refreshes it after profile changes", async () => {
  localStorage.setItem("token", "creator-token");
  api.get.mockResolvedValue({
    data: {
      name: "Alex Creator",
      profileImage: ""
    }
  });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
    </MemoryRouter>
  );

  expect(await screen.findByRole("link", { name: "Creator profile: Alex Creator" })).toHaveAttribute(
    "href",
    "/dashboard"
  );
  expect(screen.getByText("A", { selector: ".nav-profile-fallback" })).toBeInTheDocument();

  api.get.mockResolvedValueOnce({
    data: {
      name: "Alex Updated",
      profileImage: "/api/media/new-avatar"
    }
  });
  window.dispatchEvent(new Event("sociee:profile-updated"));

  await waitFor(() => {
    expect(screen.getByRole("link", { name: "Creator profile: Alex Updated" })).toBeInTheDocument();
  });
});
