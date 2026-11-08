import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";
import api from "./services/Api";

jest.mock("./services/Api", () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

beforeEach(() => {
  api.get.mockResolvedValue({ data: [] });
});

test("renders the home page", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: /welcome to sociee/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /sociee/i })).toBeInTheDocument();
  expect(await screen.findByText("No content found.")).toBeInTheDocument();
});

test("shows an error when the content response is not a list", async () => {
  api.get.mockResolvedValueOnce({ data: { contents: [] } });

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByText("Unable to load content.")).toBeInTheDocument();
});
