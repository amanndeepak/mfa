import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatInputModule, MatButtonModule,CommonModule],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill">
              <mat-label>Username</mat-label>
              <input matInput [(ngModel)]="username" name="username" required>
            </mat-form-field>
            
            <mat-form-field appearance="fill">
              <mat-label>Password</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required>
            </mat-form-field>
            
            <button mat-raised-button color="primary" type="submit">Login</button>
          </form>
          
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>

          <div class="signup-link">
  Don't have an account? <a (click)="navigateToSignup()">Sign Up</a>
</div>

        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
  .signup-link {
    margin-top: 1rem;
    text-align: center;
  }
  .signup-link a {
    color: #3f51b5;
    cursor: pointer;
    text-decoration: underline;
  }

    .login-container {
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
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

// login.component.ts
onSubmit() {
  const identifier = this.username.trim();
  const password = this.password.trim();

  if (!identifier || !password) {
    this.error = 'Please enter your username/email and password';
    return;
  }

  const result = this.authService.login(identifier, password);
  
  if (result.success) {
    this.router.navigate(['/verify']);
  } else {
    this.error = result.error || 'Login failed. Please check your credentials.';
  }
}

  // Add this method to the component class:
navigateToSignup() {
  this.router.navigate(['/signup']);
}
}