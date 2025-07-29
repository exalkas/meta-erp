/**
 * Mock Authentication Service
 *
 * Handles user authentication with multiple methods:
 * - Email/Password
 * - Magic Links
 * - Passkeys (WebAuthn)
 * - 2FA with TOTP
 */

export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: string[];
  tenant_id: string;
  created_at: string;
  last_login?: string;

  // Enhanced auth fields
  email_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  avatar_url?: string;

  // Security settings
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  passkey_enabled: boolean;
  login_attempts: number;
  locked_until?: string;
}

export interface AuthSession {
  session_id: string;
  user_id: string;
  tenant_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  last_activity: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuthMethod {
  method_id: string;
  user_id: string;
  method_type: "password" | "magic_link" | "passkey" | "totp";
  is_primary: boolean;
  created_at: string;
  last_used?: string;

  // Method-specific data
  credential_data?: any; // For passkeys
  totp_secret?: string; // For 2FA
}

export interface MagicLink {
  link_id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at?: string;
  purpose: "login" | "registration" | "password_reset";
}

class MockAuthStore {
  private users: Map<string, User> = new Map();
  private passwords: Map<string, string> = new Map();
  private sessions: Map<string, AuthSession> = new Map();
  private authMethods: Map<string, AuthMethod[]> = new Map();
  private magicLinks: Map<string, MagicLink> = new Map();
  private passkeys: Map<string, any> = new Map();

  constructor() {
    this.initializeTestData();
  }

  private initializeTestData() {
    // Test users
    const adminUser: User = {
      user_id: "admin-user-001",
      email: "admin@dev.local",
      first_name: "Admin",
      last_name: "User",
      is_active: true,
      roles: ["admin", "manager"],
      tenant_id: "dev-tenant-001",
      created_at: new Date().toISOString(),
      email_verified: true,
      phone_verified: false,
      two_factor_enabled: false,
      passkey_enabled: false,
      login_attempts: 0,
    };

    const demoUser: User = {
      user_id: "demo-user-001",
      email: "demo@dev.local",
      first_name: "Demo",
      last_name: "User",
      is_active: true,
      roles: ["user"],
      tenant_id: "dev-tenant-001",
      created_at: new Date().toISOString(),
      email_verified: true,
      phone_verified: false,
      two_factor_enabled: true,
      two_factor_secret: "JBSWY3DPEHPK3PXP", // Test TOTP secret
      passkey_enabled: false,
      login_attempts: 0,
    };

    this.users.set(adminUser.user_id, adminUser);
    this.users.set(demoUser.user_id, demoUser);

    // Test passwords
    this.passwords.set("admin@dev.local", "");
    this.passwords.set("demo@dev.local", "demo123!");

    // Test auth methods
    this.authMethods.set(adminUser.user_id, [
      {
        method_id: "auth-method-001",
        user_id: adminUser.user_id,
        method_type: "password",
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ]);

    this.authMethods.set(demoUser.user_id, [
      {
        method_id: "auth-method-002",
        user_id: demoUser.user_id,
        method_type: "password",
        is_primary: true,
        created_at: new Date().toISOString(),
      },
      {
        method_id: "auth-method-003",
        user_id: demoUser.user_id,
        method_type: "totp",
        is_primary: false,
        created_at: new Date().toISOString(),
        totp_secret: "JBSWY3DPEHPK3PXP",
      },
    ]);
  }

  getUsers() {
    return Array.from(this.users.values());
  }
  getUser(userId: string) {
    return this.users.get(userId);
  }
  getUserByEmail(email: string) {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }
  getPassword(email: string) {
    return this.passwords.get(email);
  }
  getSessions() {
    return Array.from(this.sessions.values());
  }
  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }
  getAuthMethods(userId: string) {
    return this.authMethods.get(userId) || [];
  }
  getMagicLink(token: string) {
    return this.magicLinks.get(token);
  }

  // User management
  setUser(user: User) {
    this.users.set(user.user_id, user);
  }
  setPassword(email: string, password: string) {
    this.passwords.set(email, password);
  }
  setSession(session: AuthSession) {
    this.sessions.set(session.session_id, session);
  }
  deleteSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  // Magic links
  createMagicLink(link: MagicLink) {
    this.magicLinks.set(link.token, link);
  }
  deleteMagicLink(token: string) {
    this.magicLinks.delete(token);
  }
}

const authStore = new MockAuthStore();

export class MockAuthService {
  // =====================================
  // EMAIL/PASSWORD AUTHENTICATION
  // =====================================

  static async authenticate(
    email: string,
    password: string,
    totpCode?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; session: AuthSession } | null> {
    console.log(`🔐 MockAuthService.authenticate(${email})`);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const user = authStore.getUserByEmail(email);
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return null;
    }

    if (!user.is_active) {
      console.log(`❌ User account inactive: ${email}`);
      return null;
    }

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      console.log(`❌ Account locked until: ${user.locked_until}`);
      return null;
    }

    // Verify password
    const correctPassword = authStore.getPassword(email);
    if (password !== correctPassword) {
      console.log(`❌ Invalid password for: ${email}`);

      // Increment login attempts
      user.login_attempts += 1;
      if (user.login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min lockout
      }
      authStore.setUser(user);

      return null;
    }

    // Check 2FA if enabled
    if (user.two_factor_enabled) {
      if (!totpCode) {
        throw new Error("2FA_REQUIRED");
      }

      const isValidTotp = await this.validateTOTP(user.user_id, totpCode);
      if (!isValidTotp) {
        console.log(`❌ Invalid TOTP code for: ${email}`);
        return null;
      }
    }

    // Reset login attempts on successful login
    user.login_attempts = 0;
    user.locked_until = undefined;
    user.last_login = new Date().toISOString();
    authStore.setUser(user);

    // Create session
    const session = await this.createSession(user, ipAddress, userAgent);

    console.log(`✅ Authentication successful for: ${email}`);
    return { user, session };
  }

  // =====================================
  // MAGIC LINK AUTHENTICATION
  // =====================================

  static async sendMagicLink(
    email: string,
    purpose: "login" | "registration" | "password_reset" = "login"
  ): Promise<{ success: boolean; linkId?: string }> {
    console.log(`🔗 MockAuthService.sendMagicLink(${email}, ${purpose})`);

    await new Promise((resolve) => setTimeout(resolve, 200));

    // For registration, don't require existing user
    if (purpose !== "registration") {
      const user = authStore.getUserByEmail(email);
      if (!user) {
        console.log(`❌ User not found for magic link: ${email}`);
        return { success: false };
      }
    }

    const magicLink: MagicLink = {
      link_id: `ml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      token: `token-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      purpose,
    };

    authStore.createMagicLink(magicLink);

    console.log(`✅ Magic link created: ${magicLink.link_id}`);
    console.log(`🔗 Magic link URL: /auth/magic-link?token=${magicLink.token}`);

    return { success: true, linkId: magicLink.link_id };
  }

  static async verifyMagicLink(
    token: string
  ): Promise<{ user: User; session: AuthSession } | null> {
    console.log(
      `🔗 MockAuthService.verifyMagicLink(${token.substring(0, 10)}...)`
    );

    await new Promise((resolve) => setTimeout(resolve, 150));

    const magicLink = authStore.getMagicLink(token);
    if (!magicLink) {
      console.log(`❌ Magic link not found`);
      return null;
    }

    if (magicLink.used_at) {
      console.log(`❌ Magic link already used`);
      return null;
    }

    if (new Date(magicLink.expires_at) < new Date()) {
      console.log(`❌ Magic link expired`);
      return null;
    }

    const user = authStore.getUserByEmail(magicLink.email);
    if (!user) {
      console.log(`❌ User not found for magic link`);
      return null;
    }

    // Mark link as used
    magicLink.used_at = new Date().toISOString();
    authStore.createMagicLink(magicLink);

    // Update user login time
    user.last_login = new Date().toISOString();
    authStore.setUser(user);

    // Create session
    const session = await this.createSession(user);

    console.log(`✅ Magic link verified for: ${user.email}`);
    return { user, session };
  }

  // =====================================
  // PASSKEY (WebAuthn) SUPPORT
  // =====================================

  static async initiatePasskeyRegistration(userId: string): Promise<any> {
    console.log(`🔑 MockAuthService.initiatePasskeyRegistration(${userId})`);

    // Mock WebAuthn registration challenge
    const challenge = {
      challenge: new Uint8Array(32),
      rp: { name: "Axiologic Platform", id: "axiologic.com" },
      user: {
        id: new TextEncoder().encode(userId),
        name: "user@example.com",
        displayName: "User",
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      timeout: 60000,
    };

    return challenge;
  }

  static async completePasskeyRegistration(
    userId: string,
    credential: any
  ): Promise<boolean> {
    console.log(`🔑 MockAuthService.completePasskeyRegistration(${userId})`);

    // In real implementation, verify credential and store public key
    const user = authStore.getUser(userId);
    if (user) {
      user.passkey_enabled = true;
      authStore.setUser(user);

      // Add passkey auth method
      const authMethods = authStore.getAuthMethods(userId);
      authMethods.push({
        method_id: `passkey-${Date.now()}`,
        user_id: userId,
        method_type: "passkey",
        is_primary: false,
        created_at: new Date().toISOString(),
        credential_data: credential,
      });

      return true;
    }

    return false;
  }

  // =====================================
  // 2FA (TOTP) SUPPORT
  // =====================================

  static async setupTOTP(
    userId: string
  ): Promise<{ secret: string; qrCode: string } | null> {
    console.log(`🔒 MockAuthService.setupTOTP(${userId})`);

    const user = authStore.getUser(userId);
    if (!user) return null;

    // Generate TOTP secret (in real app, use crypto.randomBytes)
    const secret = "JBSWY3DPEHPK3PXP"; // Mock secret
    const qrCode = `otpauth://totp/Axiologic:${user.email}?secret=${secret}&issuer=Axiologic`;

    return { secret, qrCode };
  }

  static async enableTOTP(
    userId: string,
    secret: string,
    totpCode: string
  ): Promise<boolean> {
    console.log(`🔒 MockAuthService.enableTOTP(${userId})`);

    const isValid = await this.validateTOTP(userId, totpCode, secret);
    if (!isValid) return false;

    const user = authStore.getUser(userId);
    if (user) {
      user.two_factor_enabled = true;
      user.two_factor_secret = secret;
      authStore.setUser(user);
      return true;
    }

    return false;
  }

  static async validateTOTP(
    userId: string,
    code: string,
    secret?: string
  ): Promise<boolean> {
    console.log(`🔒 MockAuthService.validateTOTP(${userId}, ${code})`);

    // Mock TOTP validation - in real app, use libraries like speakeasy
    const validCodes = ["123456", "654321", "000000"]; // Mock valid codes
    return validCodes.includes(code);
  }

  // =====================================
  // SESSION MANAGEMENT
  // =====================================

  static async createSession(
    user: User,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthSession> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const accessToken = `access-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
    const refreshToken = `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;

    const session: AuthSession = {
      session_id: sessionId,
      user_id: user.user_id,
      tenant_id: user.tenant_id,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    authStore.setSession(session);
    return session;
  }

  static async getCurrentUser(accessToken: string): Promise<User | null> {
    console.log(
      `🔐 MockAuthService.getCurrentUser(${accessToken.substring(0, 20)}...)`
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const sessions = authStore.getSessions();
    const session = sessions.find((s) => s.access_token === accessToken);

    if (!session) {
      console.log(`❌ Session not found for token`);
      return null;
    }

    if (new Date(session.expires_at) < new Date()) {
      console.log(`❌ Session expired`);
      authStore.deleteSession(session.session_id);
      return null;
    }

    const user = authStore.getUser(session.user_id);
    if (user) {
      console.log(`✅ Found user: ${user.email}`);

      // Update last activity
      session.last_activity = new Date().toISOString();
      authStore.setSession(session);
    }

    return user || null;
  }

  static async refreshToken(refreshToken: string): Promise<AuthSession | null> {
    console.log(
      `🔄 MockAuthService.refreshToken(${refreshToken.substring(0, 20)}...)`
    );

    const sessions = authStore.getSessions();
    const session = sessions.find((s) => s.refresh_token === refreshToken);

    if (!session) {
      console.log(`❌ Refresh token not found`);
      return null;
    }

    const user = authStore.getUser(session.user_id);
    if (!user) {
      console.log(`❌ User not found for refresh token`);
      return null;
    }

    // Create new session
    const newSession = await this.createSession(user);

    // Remove old session
    authStore.deleteSession(session.session_id);

    console.log(`✅ Token refreshed for user: ${user.email}`);
    return newSession;
  }

  static async logout(sessionId: string): Promise<boolean> {
    console.log(`🚪 MockAuthService.logout(${sessionId})`);

    authStore.deleteSession(sessionId);
    console.log(`✅ Session terminated: ${sessionId}`);
    return true;
  }

  // =====================================
  // USER REGISTRATION
  // =====================================

  static async registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tenantId: string = "dev-tenant-001"
  ): Promise<{ user: User; session: AuthSession } | null> {
    console.log(`📝 MockAuthService.registerUser(${email})`);

    await new Promise((resolve) => setTimeout(resolve, 400));

    // Check if user already exists
    const existingUser = authStore.getUserByEmail(email);
    if (existingUser) {
      console.log(`❌ User already exists: ${email}`);
      return null;
    }

    const newUser: User = {
      user_id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      first_name: firstName,
      last_name: lastName,
      is_active: true,
      roles: ["user"],
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      email_verified: false, // Require email verification
      phone_verified: false,
      two_factor_enabled: false,
      passkey_enabled: false,
      login_attempts: 0,
    };

    authStore.setUser(newUser);
    authStore.setPassword(email, password);

    // Create session
    const session = await this.createSession(newUser);

    console.log(`✅ User registered: ${email}`);
    return { user: newUser, session };
  }
}

export default MockAuthService;
