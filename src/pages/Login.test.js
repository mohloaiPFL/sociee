import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import api from "../services/Api";

jest.mock("../services/Api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

function renderLogin() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Login />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test("shows account registration when the first creator account does not exist", async () => {
  api.get.mockResolvedValue({ data: { setupComplete: false } });

  renderLogin();

  expect(await screen.findByRole("heading", { name: /create creator account/i })).toBeInTheDocument();
  expect(screen.getByText(/create your own creator account/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^create account$/i })).toBeInTheDocument();
});

test("shows the login form after creator setup is complete", async () => {
  api.get.mockResolvedValue({ data: { setupComplete: true } });

  renderLogin();

  expect(await screen.findByRole("heading", { name: /creator login/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /switch to create account mode/i })).toBeInTheDocument();
});

test("keeps the login form visible and offers a retry when setup status cannot load", async () => {
  api.get
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: { setupComplete: true } });

  renderLogin();

  expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
  fireEvent.click(await screen.findByRole("button", { name: /retry connection/i }));

  expect(await screen.findByRole("heading", { name: /creator login/i })).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(2);
});

test("stores the token after a successful login", async () => {
  api.get.mockResolvedValue({ data: { setupComplete: true } });
  api.post.mockResolvedValue({ data: { token: "test-token" } });

  renderLogin();

  fireEvent.change(await screen.findByPlaceholderText(/email address/i), {
    target: { value: "creator@example.com" }
  });
  fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: "correct-password" }
  });
  fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

  await waitFor(() => expect(localStorage.getItem("token")).toBe("test-token"));
  expect(api.post).toHaveBeenCalledWith("/auth/login", {
    email: "creator@example.com",
    password: "correct-password"
  });
});

test("registers another creator account when setup is already complete", async () => {
  api.get.mockResolvedValue({ data: { setupComplete: true } });
  api.post.mockResolvedValue({ data: { token: "setup-token" } });

  renderLogin();

  fireEvent.click(await screen.findByRole("button", { name: /switch to create account mode/i }));
  expect(await screen.findByRole("heading", { name: /create creator account/i })).toBeInTheDocument();
  fireEvent.change(await screen.findByPlaceholderText(/creator name/i), {
    target: { value: "Creator" }
  });
  fireEvent.change(screen.getByPlaceholderText(/email address/i), {
    target: { value: "creator@example.com" }
  });
  fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: "long-enough-password" }
  });
  fireEvent.click(screen.getByRole("button", { name: /^create account$/i }));

  await waitFor(() => expect(localStorage.getItem("token")).toBe("setup-token"));
  expect(api.post).toHaveBeenCalledWith("/auth/register", {
    email: "creator@example.com",
    password: "long-enough-password",
    displayName: "Creator"
  });
});
