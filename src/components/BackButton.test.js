import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import BackButton from "./BackButton";

function CurrentPath() {
  const location = useLocation();
  return <p>Current page: {location.pathname}</p>;
}

test("does not show a back button on the home page", () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <BackButton />
      <CurrentPath />
    </MemoryRouter>
  );

  expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
});

test("provides a back button on content pages and returns to the previous page", () => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={["/", "/content/example"]}
      initialIndex={1}
    >
      <BackButton />
      <CurrentPath />
      <Routes>
        <Route path="/" element={<p>Home page</p>} />
        <Route path="/content/:id" element={<p>Content page</p>} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: /back/i }));

  expect(screen.getByText("Current page: /")).toBeInTheDocument();
  expect(screen.getByText("Home page")).toBeInTheDocument();
});

test("returns a directly opened content page to the home page", () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/content/example"]}>
      <BackButton />
      <Routes>
        <Route path="/" element={<p>Home page</p>} />
        <Route path="/content/:id" element={<p>Content page</p>} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: /back/i }));

  expect(screen.getByText("Home page")).toBeInTheDocument();
});
