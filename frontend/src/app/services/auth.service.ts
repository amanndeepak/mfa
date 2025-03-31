import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface TokenPayload {
  version: string;
  userId: string;
  email: string;
  sessionId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
  qrCodeUrl?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SECRET_KEY = 'secure-key-' + Math.random().toString(36).substring(2, 15);
  private readonly CURRENT_USER_KEY = 'currentUser';
  private readonly USERS_KEY = 'mfa_app_users';
  private verificationStatus = false;
  private readonly API_URL = 'http://localhost:3000/api'; // Update with your backend URL

  constructor(private http: HttpClient) {
    this.initializeDemoUsers();
  }

  /* ========== USER MANAGEMENT ========== */
  private initializeDemoUsers(): void {
    if (!this.getUsers().length) {
      this.saveUsers([
        { 
          id: uuidv4(), 
          username: 'demo', 
          email: 'demo@example.com',
          phoneNumber: '1234567890',
          password: 'demo123'
        }
      ]);
    }
  }

  private getUsers(): User[] {
    const usersJson = localStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /* ========== AUTHENTICATION METHODS ========== */
  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  isVerified(): boolean {
    return this.verificationStatus;
  }

  setVerificationStatus(status: boolean): void {
    this.verificationStatus = status;
  }

  login(identifier: string, password: string): AuthResponse {
    const users = this.getUsers();
    const user = users.find(u => 
      (u.username === identifier || u.email === identifier) && 
      u.password === password
    );

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber
    }));

    return { success: true, user };
  }

  register(username: string, email: string, phoneNumber: string, password: string): AuthResponse {
    const users = this.getUsers();
    
    if (users.some(u => u.username === username)) {
      return { success: false, error: 'Username already exists' };
    }
    
    if (users.some(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const newUser: User = {
      id: uuidv4(),
      username,
      email,
      phoneNumber,
      password // Note: In production, hash this password!
    };

    this.saveUsers([...users, newUser]);
    return { success: true, user: newUser };
  }

  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.verificationStatus = false;
  }

  /* ========== QR CODE & MFA METHODS ========== */
  async generateQRCode(): Promise<AuthResponse> {
    const user = this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload: TokenPayload = {
        version: '1.0',
        userId: user.id,
        email: user.email,
        sessionId: uuidv4(),
        timestamp: timestamp,
        expiresAt: timestamp + 300, // 5 minutes expiration
        signature: this.generateSignature(user.id, timestamp)
      };

      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(payload), {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2
      });

      // Send QR code to user's email
      try {
        await this.sendQRCodeEmail(user.email, qrCodeUrl, payload);
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
        // Continue even if email fails
      }

      return { success: true, qrCodeUrl };
    } catch (error) {
      console.error('QR generation failed:', error);
      return { success: false, error: 'Failed to generate QR code' };
    }
  }

  private async sendQRCodeEmail(email: string, qrCodeUrl: string, payload: TokenPayload): Promise<void> {
    try {
      await this.http.post(`${this.API_URL}/send-qr`, {
        email,
        qrCodeUrl,
        payload: JSON.stringify(payload)
      }).toPromise();
    } catch (error) {
      console.error('Email API error:', error);
      throw new Error('Failed to send QR code via email');
    }
  }

  verifyToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
    try {
      let payload: TokenPayload;
      
      // First try parsing directly
      try {
        payload = JSON.parse(token);
      } catch (e) {
        // If direct parse fails, clean the string
        const cleanToken = token
          .replace(/^"|"$/g, '')
          .replace(/\\"/g, '"')
          .trim();
        
        payload = JSON.parse(cleanToken);
      }

      this.validateToken(payload);
      return { valid: true, payload };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid token' 
      };
    }
  }

  private validateToken(payload: any): asserts payload is TokenPayload {
    const requiredFields = ['version', 'userId', 'email', 'signature', 'expiresAt', 'timestamp'];
    const missingFields = requiredFields.filter(field => !(field in payload));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    const expectedSig = this.generateSignature(payload.userId, payload.timestamp);
    if (payload.signature !== expectedSig) {
      throw new Error('Invalid signature');
    }
  }

  private generateSignature(userId: string, timestamp: number): string {
    const data = `${userId}|${this.SECRET_KEY}|${timestamp}`;
    return btoa(unescape(encodeURIComponent(data)));
  }
}