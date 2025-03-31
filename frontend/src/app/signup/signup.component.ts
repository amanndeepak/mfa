// signup.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatInputModule, MatButtonModule, CommonModule],
  template: `
    <div class="signup-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill">
              <mat-label>Username</mat-label>
              <input matInput [(ngModel)]="username" name="username" required>
            </mat-form-field>
            
            <mat-form-field appearance="fill">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required>
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Phone Number</mat-label>
              <input matInput type="tel" [(ngModel)]="phoneNumber" name="phoneNumber" 
                     pattern="[0-9]{10}" placeholder="1234567890" required>
              <mat-hint>Enter 10-digit phone number</mat-hint>
            </mat-form-field>
            
            <mat-form-field appearance="fill">
              <mat-label>Password</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required>
            </mat-form-field>
            
            <mat-form-field appearance="fill">
              <mat-label>Confirm Password</mat-label>
              <input matInput type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required>
            </mat-form-field>
            
            <button mat-raised-button color="primary" type="submit">Sign Up</button>
          </form>
          
          <div class="login-link">
            Already have an account? <a (click)="navigateToLogin()">Login</a>
          </div>
          
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .signup-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
    mat-card {
      width: 100%;
      max-width: 400px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }
    .error-message {
      color: red;
      margin-top: 1rem;
    }
    .login-link {
      margin-top: 1rem;
      text-align: center;
    }
    .login-link a {
      color: #3f51b5;
      cursor: pointer;
      text-decoration: underline;
    }
  `]
})
export class SignupComponent {
  username = '';
  email = '';
  phoneNumber = '';
  password = '';
  confirmPassword = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
  
    if (!/^\d{10}$/.test(this.phoneNumber)) {
      this.error = 'Please enter a valid 10-digit phone number';
      return;
    }
  
    const result = this.authService.register(
      this.username,
      this.email,
      this.phoneNumber,
      this.password
    );
    
    if (result.success) {
      this.router.navigate(['/login']);
    } else {
      this.error = result.error || 'Registration failed';
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}