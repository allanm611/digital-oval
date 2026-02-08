// import {
//   createContext,
//   useContext,
//   useState,
//   ReactNode,
//   useEffect,
// } from "react";
// import { authService } from "../features/auth/services/authService";
// import { User, LoginResponse } from "../features/auth/types/auth";

// // export interface AuthUser {
// //   id: number;
// //   uuid: string;
// //   username: string;
// //   email: string;
// //   first_name: string;
// //   last_name: string;
// //   display_name?: string;
// // }
// // export interface LoginResponse {
// //   success: boolean;
// //   user?: AuthUser;
// //   session?: { 
// //     id: string; 
// //     token: string; 
// //     expires_at: string
// //     permissions?:string[] 
// //   };
// //   error?: { 
// //     code: string; 
// //     message: string 
// //   };
// // }
// interface AuthContextType {
//   isAuthenticated: boolean;
//   user: User | null;
//   token: string | null;
//   login: (email: string, password: string) => Promise<LoginResponse>;
//   logout: () => Promise<void>;
//   requestPasswordReset: (email: string) => Promise<void>;
//   resetPassword: (
//     token: string,
//     email: string,
//     newPassword: string
//   ) => Promise<void>;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export function AuthProvider({ children }: AuthProviderProps) {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Check for existing token on app load
//     const savedToken = localStorage.getItem("auth_token");
//     const savedUser = localStorage.getItem("auth_user");

//     if (savedToken && savedUser) {
//       setToken(savedToken);
//       setUser(JSON.parse(savedUser));
//       setIsAuthenticated(true);
//     }
//     setLoading(false);
//   }, []);

//   const login = async (
//     email: string,
//     password: string
//   ): Promise<LoginResponse> => {
//     const response = await authService.login({ email, password });

//     if (!response.success || !response.session) {
//       throw new Error(response.error?.message || "Login failed");
//     }

//     // Store auth data
//     localStorage.setItem("auth_token", response.session.token);
//     localStorage.setItem("session_id", response.session.id);

//     setToken(response.session.token);
//     setIsAuthenticated(true);

//     // Fetch user role from permissions endpoint
//     let userRole: "admin" | "user" = "user"; // Default role
//     try {
//       const permissionsResponse = await authService.getPermissions();
//       if (
//         permissionsResponse.success &&
//         permissionsResponse.roles &&
//         permissionsResponse.roles.length > 0
//       ) {
//         // Use the first role, or check if 'admin' is in the roles array
//         userRole = permissionsResponse.roles.includes("admin")
//           ? "admin"
//           : "user";
//       }
//     } catch (error) {
//       console.warn(
//         "Failed to fetch user permissions, using default role:",
//         error
//       );
//     }

//     // Use user data from response if available, otherwise create basic user
//     if (response.user) {
//       const user: User = {
//         user_id: response.user.id,
//         first_name: response.user.first_name,
//         last_name: response.user.last_name,
//         private_email_address: response.user.email,
//         email: response.user.email,
//         role: userRole,
//         is_activated: true,
//         is_deleted: false,
//         force_password_reset: false,
//         created_on: new Date().toISOString(),
//         updated_on: new Date().toISOString(),
//       };
//       setUser(user);
//       localStorage.setItem("auth_user", JSON.stringify(user));
//     } else {
//       // Fallback basic user if no user data in response
//       const basicUser: User = {
//         user_id: 0,
//         first_name: "",
//         last_name: "",
//         private_email_address: email,
//         email,
//         role: userRole,
//         is_activated: true,
//         is_deleted: false,
//         force_password_reset: false,
//         created_on: new Date().toISOString(),
//         updated_on: new Date().toISOString(),
//       };
//       setUser(basicUser);
//       localStorage.setItem("auth_user", JSON.stringify(basicUser));
//     }

//     return response;
//   };

//   const logout = async (): Promise<void> => {
//     try {
//       await authService.logout();
//     } catch (error) {
//       console.error("Logout error:", error);
//     } finally {
//       // Clear local state regardless of API call success
//       setIsAuthenticated(false);
//       setUser(null);
//       setToken(null);

//       // Clear localStorage
//       localStorage.removeItem("auth_token");
//       localStorage.removeItem("auth_user");
//       localStorage.removeItem("session_id");
//     }
//   };

//   const requestPasswordReset = async (email: string): Promise<void> => {
//     await authService.requestPasswordReset({ email });
//   };

//   const resetPassword = async (
//     token: string,
//     email: string,
//     newPassword: string
//   ): Promise<void> => {
//     await authService.completePasswordReset({ token, email, newPassword });
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         isAuthenticated,
//         user,
//         token,
//         login,
//         logout,
//         requestPasswordReset,
//         resetPassword,
//         loading,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }
