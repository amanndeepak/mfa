import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="dashboard-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Welcome to your Dashboard</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p *ngIf="user">Logged in as: {{ user.username }} ({{ user.email }})</p>
          <button mat-raised-button color="warn" (click)="logout()">Logout</button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
    mat-card {
      width: 100%;
      max-width: 600px;
    }
  `]
})
export class DashboardComponent {
  user: { username: string, email: string } | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}