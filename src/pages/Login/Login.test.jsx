import React from "react";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider } from "../../hooks/AuthContext";

import * as UserActions from "../../actions/auth";

import Login from "./Login";

const authSpy = jest.spyOn(UserActions, "login");
const dispatchMock = jest.fn();

describe("<Login />", () => {
  const history = createMemoryHistory();
  const setup = () =>
    render(
      <AuthProvider value={{ state: {}, dispatch: dispatchMock }}>
        <Router history={history}>
          <Login />
        </Router>
      </AuthProvider>
    );

  beforeEach(() => {
    setup();
  });

  it("Should render the login form", () => {
    expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /cadastrar/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  describe("When the user clicks on the button to register", () => {
    it("Should redirect to the sign up page", () => {
      const registerButton = screen.getByRole("button", { name: /cadastrar/i });
      userEvent.click(registerButton);

      expect(history.location.pathname).toStrictEqual("/cadastro");
    });
  });

  describe("When the user types invalid credentials", () => {
    beforeAll(() => {
      authSpy.mockRejectedValue(new Error("Usuário ou senha inválidos"));
    });
    it("Should show an error message", async () => {
      const testUsername = "test";
      const usernameInput = screen.getByLabelText(/usuário/i);
      userEvent.paste(usernameInput, testUsername);

      const testPassword = "testPassword";
      const passwordInput = screen.getByLabelText(/senha/i);
      userEvent.paste(passwordInput, testPassword);

      const loginButton = screen.getByRole("button", { name: /entrar/i });
      userEvent.click(loginButton);

      expect(authSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { username: testUsername, password: testPassword },
        })
      );
      expect(
        await screen.findByText("Usuário ou senha inválidos")
      ).toBeInTheDocument();
    });
  });

  describe("When the user types valid credentials", () => {
    const testUsername = "test";
    const testPassword = "testPassword";

    beforeEach(async () => {
      authSpy.mockResolvedValue({
        status: 200,
      });

      const usernameInput = screen.getByLabelText(/usuário/i);
      userEvent.paste(usernameInput, testUsername);

      const passwordInput = screen.getByLabelText(/senha/i);
      userEvent.paste(passwordInput, testPassword);

      const loginButton = screen.getByRole("button", { name: /entrar/i });
      await act(async () => userEvent.click(loginButton));
    });

    it("should call the auth action", async () => {
      expect(authSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { username: testUsername, password: testPassword },
        })
      );
    });
    it("should redirect the user to the home page", () => {
      expect(history.location.pathname).toStrictEqual("/");
    });
  });
});
