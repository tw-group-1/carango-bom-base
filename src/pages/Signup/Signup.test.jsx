import React from "react";
import { MemoryRouter, Route } from "react-router-dom";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Signup from "./Signup";
import * as UserActions from "../../actions/auth";

let testLocation;
const setup = (user) => {
  return render(
    <MemoryRouter initialEntries={["/login", "/cadastro"]} initialIndex={1}>
      <Route path="/cadastro">
        <Signup user={user} />
      </Route>
      <Route
        path="*"
        render={({ location }) => {
          testLocation = location;
          return null;
        }}
      />
    </MemoryRouter>
  );
};

const mockUser = {
  username: "teste",
  password: "teste123123",
  confirmPassword: "teste123123",
};

const userActionServiceSpy = jest.spyOn(UserActions, "signup");

describe("<Signup />", () => {
  describe("User is authenticated", () => {
    beforeEach(() => {
      setup({
        username: "teste",
      });
    });
    it("should redirect the user to vehicles page", () => {
      expect(testLocation.pathname).toStrictEqual("/");
    });
  });
  describe("User isnt authenticated", () => {
    describe("Cancel", () => {
      it("should redirect me to '/login' when I click the 'cancel' button", () => {
        setup();
        userEvent.click(screen.getByRole("button", { name: /cancelar/i }));

        expect(testLocation.pathname).toBe("/login");
      });
    });
    describe("Register", () => {
      describe("Form validation", () => {
        beforeEach(() => {
          setup();
        });
        it("should show me an error if I don't fill the 'username' field", async () => {
          const username = screen.getByRole("textbox", { name: /usuário/i });
          fireEvent.focus(username);
          fireEvent.blur(username);

          const errorMsg = await screen.findByText(
            /Usuário deve ter ao menos 3 letras./
          );
          expect(errorMsg).toBeInTheDocument();
        });

        it("should show me an error if I don't fill the 'password' field", async () => {
          const password = screen.getByLabelText(/Senha/);
          userEvent.type(password, "123");
          fireEvent.blur(password);

          const errorMsg = await screen.findByText(
            /Senha deve ter ao menos 6 caracteres./
          );
          expect(errorMsg).toBeInTheDocument();
        });

        it("should show me an error if 'confirmPassword' doesn't match 'password'", async () => {
          const password = screen.getByLabelText(/Senha/);
          userEvent.type(password, mockUser.password);
          const confirmPassword =
            screen.getByLabelText(/confirmação da senha/i);
          userEvent.type(confirmPassword, "12345");
          fireEvent.blur(confirmPassword);
          const errorMsg = await screen.findByText(
            /As senhas não correspondem./
          );
          expect(errorMsg).toBeInTheDocument();
        });

        it("should render a disabled 'cadastrar' button if the validation is invalid", () => {
          const password = screen.getByLabelText(/Senha/);
          const confirmPassword =
            screen.getByLabelText(/confirmação da senha/i);
          userEvent.type(password, mockUser.password);
          userEvent.type(confirmPassword, mockUser.confirmPassword);
          fireEvent.blur(screen.getByRole("textbox", { name: /usuário/i }));
          expect(
            screen.getByRole("button", { name: /cadastrar/i })
          ).toBeDisabled();
        });
      });

      describe("When submits signup form", () => {
        beforeAll(() => {
          userActionServiceSpy.mockResolvedValue();
        });
        beforeEach(async () => {
          setup();
          const username = screen.getByRole("textbox", { name: /usuário/i });
          const password = screen.getByLabelText(/Senha/);
          const confirmPassword =
            screen.getByLabelText(/confirmação da senha/i);
          const btn = screen.getByRole("button", { name: /cadastrar/i });

          userEvent.paste(username, mockUser.username);
          userEvent.paste(password, mockUser.password);
          userEvent.paste(confirmPassword, mockUser.confirmPassword);
          await act(async () => userEvent.click(btn));
        });

        it("should register user with correct data", () => {
          expect(userActionServiceSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              user: {
                username: mockUser.username,
                password: mockUser.password,
              },
            })
          );
        });

        it("should redirect me to login after signup", () => {
          expect(testLocation.pathname).toBe("/login");
        });

        describe("And something fails", () => {
          beforeAll(() => {
            userActionServiceSpy.mockRejectedValue(
              new Error("Usuário já existe")
            );
          });

          it("should show the error message", async () => {
            const errorMsg = await screen.findByText(/Usuário já existe/i);
            expect(errorMsg).toBeInTheDocument();
          });
        });
      });
    });
  });
});
