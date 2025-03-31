import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import jsQR from 'jsqr';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule
  ],
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css']
})
export class VerifyComponent implements OnDestroy {
  @ViewChild('scannerVideo') scannerVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('scannerCanvas') scannerCanvas!: ElementRef<HTMLCanvasElement>;
  
  qrGenerated = false;
  qrCodeUrl = '';
  scannerEnabled = false;
  scanError = '';
  verificationSuccess = false;
  scanAttempts = 0;
  isLoading = false;
  
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  constructor(
    public router: Router,
    private authService: AuthService
  ) {}

 // In verify.component.ts - update the method call
async generateQR() {
  this.isLoading = true;
  this.scanError = '';
  
  try {
    // Changed from generateAndSendQRCode() to generateQRCode()
    const result = await this.authService.generateQRCode();
    if (result.success && result.qrCodeUrl) {
      this.qrCodeUrl = result.qrCodeUrl;
      this.qrGenerated = true;
    } else {
      this.scanError = result.error || 'Failed to generate QR code';
    }
  } catch (error) {
    console.error('QR generation error:', error);
    this.scanError = 'Failed to generate QR code';
  } finally {
    this.isLoading = false;
  }
}

  async startScanner() {
    this.scanAttempts = 0;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      this.scannerVideo.nativeElement.srcObject = this.stream;
      await this.scannerVideo.nativeElement.play();
      this.scanFrame();
    } catch (err) {
      console.error('Camera error:', err);
      this.scanError = 'Camera access denied. Please enable permissions.';
    }
  }

  private scanFrame() {
    if (!this.scannerEnabled || !this.scannerCanvas?.nativeElement) return;

    const video = this.scannerVideo.nativeElement;
    const canvas = this.scannerCanvas.nativeElement;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
      if (imageData) {
        this.scanAttempts++;
        try {
          const code = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
            { 
              inversionAttempts: 'attemptBoth'
            }
          );

          if (code) {
            this.processScannedData(code.data);
            return;
          }
        } catch (e) {
          console.error('Scan error:', e);
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.scanFrame());
  }

  private processScannedData(data: string) {
    try {
      const result = this.authService.verifyToken(data);
      
      if (result.valid) {
        this.scannerEnabled = false;
        this.verificationSuccess = true;
        this.scanError = '';
        this.authService.setVerificationStatus(true);
        this.router.navigate(['/dashboard']);
      } else {
        this.scanError = result.error || 'Verification failed';
      }
    } catch (e) {
      this.scanError = `Invalid QR code: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  stopScanner() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  toggleScanner() {
    if (this.scannerEnabled) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
    this.scannerEnabled = !this.scannerEnabled;
  }

  ngOnDestroy() {
    this.stopScanner();
  }
}