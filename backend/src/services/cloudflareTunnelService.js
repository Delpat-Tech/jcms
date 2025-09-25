// services/cloudflareTunnelService.js
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

class CloudflareTunnelService {
  constructor() {
    this.tunnelProcess = null;
    this.tunnelUrl = null;
    this.isRunning = false;
    this.cloudflaredPath = process.env.CLOUDFLARED_PATH || './cloudflared.exe';
    this.localPort = process.env.LOCAL_PORT || '5000';
  }

  /**
   * Start Cloudflare Tunnel
   */
  async startTunnel() {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        resolve({
          success: true,
          tunnelUrl: this.tunnelUrl,
          message: 'Tunnel is already running'
        });
        return;
      }

      logger.info('Starting Cloudflare Tunnel...');

      // Command: .\cloudflared.exe tunnel --url http://localhost:5000/
      // Properly quote the path to handle spaces in Windows paths
      const command = `"${this.cloudflaredPath}"`;
      const args = ['tunnel', '--url', `http://localhost:${this.localPort}/`];

      this.tunnelProcess = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        windowsVerbatimArguments: true // Important for Windows paths with spaces
      });

      let output = '';
      let tunnelFound = false;

      // Function to check for tunnel URL in any output
      const checkForTunnelUrl = (text, source) => {
        console.log(`Cloudflare Tunnel ${source}:`, text);
        
        // Look for the tunnel URL pattern
        const urlMatch = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (urlMatch && !tunnelFound) {
          this.tunnelUrl = urlMatch[0];
          this.isRunning = true;
          tunnelFound = true;

          logger.info('Cloudflare Tunnel started successfully', {
            tunnelUrl: this.tunnelUrl,
            source: source
          });

          resolve({
            success: true,
            tunnelUrl: this.tunnelUrl,
            message: 'Tunnel started successfully'
          });
        }
      };

      // Capture stdout
      this.tunnelProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        checkForTunnelUrl(text, 'stdout');
      });

      // Capture stderr (tunnel URL often comes through stderr)
      this.tunnelProcess.stderr.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Check for tunnel URL first
        checkForTunnelUrl(text, 'stderr');
        
        // Only treat as error if it contains actual error keywords and no tunnel URL
        if ((text.includes('failed to connect') || text.includes('ERR ')) && !text.includes('trycloudflare.com')) {
          logger.error('Cloudflare Tunnel error', { error: text });
          
          if (!tunnelFound) {
            reject(new Error(`Failed to start tunnel: ${text}`));
          }
        }
      });

      // Handle process exit
      this.tunnelProcess.on('exit', (code, signal) => {
        logger.info('Cloudflare Tunnel process exited', { code, signal });
        this.isRunning = false;
        this.tunnelUrl = null;
        this.tunnelProcess = null;
      });

      // Handle process errors
      this.tunnelProcess.on('error', (error) => {
        logger.error('Cloudflare Tunnel process error', { error: error.message });
        this.isRunning = false;
        this.tunnelUrl = null;
        this.tunnelProcess = null;
        
        if (!tunnelFound) {
          reject(error);
        }
      });

      // Timeout after 60 seconds if no tunnel URL is found
      setTimeout(() => {
        if (!tunnelFound) {
          this.stopTunnel();
          reject(new Error('Timeout: Could not establish tunnel within 60 seconds'));
        }
      }, 60000);
    });
  }

  /**
   * Stop Cloudflare Tunnel
   */
  async stopTunnel() {
    return new Promise((resolve) => {
      if (!this.tunnelProcess || !this.isRunning) {
        resolve({
          success: true,
          message: 'Tunnel is not running'
        });
        return;
      }

      logger.info('Stopping Cloudflare Tunnel...');

      this.tunnelProcess.on('exit', () => {
        this.isRunning = false;
        this.tunnelUrl = null;
        this.tunnelProcess = null;
        
        logger.info('Cloudflare Tunnel stopped successfully');
        resolve({
          success: true,
          message: 'Tunnel stopped successfully'
        });
      });

      // Kill the process
      this.tunnelProcess.kill('SIGTERM');

      // Force kill after 5 seconds if it doesn't stop gracefully
      setTimeout(() => {
        if (this.tunnelProcess) {
          this.tunnelProcess.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  /**
   * Get tunnel status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      tunnelUrl: this.tunnelUrl,
      cloudflaredPath: this.cloudflaredPath,
      localPort: this.localPort
    };
  }

  /**
   * Generate public URL for a collection/group
   */
  generatePublicUrl(groupName, filename = '') {
    if (!this.isRunning || !this.tunnelUrl) {
      return null;
    }

    // Clean group name for URL
    const cleanGroupName = groupName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (filename) {
      return `${this.tunnelUrl}/public/${cleanGroupName}/${filename}`;
    } else {
      return `${this.tunnelUrl}/public/${cleanGroupName}/`;
    }
  }

  /**
   * Create public directory structure for a collection
   */
  async createPublicDirectory(groupName) {
    try {
      const cleanGroupName = groupName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      const publicDir = path.join(__dirname, '..', '..', 'public', cleanGroupName);
      
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
        logger.info('Created public directory', { path: publicDir });
      }

      return {
        success: true,
        publicDir,
        urlPath: `/public/${cleanGroupName}/`
      };
    } catch (error) {
      logger.error('Failed to create public directory', {
        groupName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Copy image to public directory
   */
  async copyImageToPublic(imagePath, groupName, filename) {
    try {
      const result = await this.createPublicDirectory(groupName);
      const publicFilePath = path.join(result.publicDir, filename);

      // Copy file to public directory
      fs.copyFileSync(imagePath, publicFilePath);

      logger.info('Image copied to public directory', {
        source: imagePath,
        destination: publicFilePath
      });

      return {
        success: true,
        publicPath: publicFilePath,
        publicUrl: this.generatePublicUrl(groupName, filename)
      };
    } catch (error) {
      logger.error('Failed to copy image to public directory', {
        imagePath,
        groupName,
        filename,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Remove image from public directory
   */
  async removeImageFromPublic(groupName, filename) {
    try {
      const cleanGroupName = groupName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      const publicFilePath = path.join(__dirname, '..', '..', 'public', cleanGroupName, filename);

      if (fs.existsSync(publicFilePath)) {
        fs.unlinkSync(publicFilePath);
        logger.info('Image removed from public directory', { path: publicFilePath });
      }

      return {
        success: true,
        message: 'Image removed from public directory'
      };
    } catch (error) {
      logger.error('Failed to remove image from public directory', {
        groupName,
        filename,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if cloudflared is available
   */
  async checkCloudflaredAvailability() {
    return new Promise((resolve) => {
      exec(`"${this.cloudflaredPath}" --version`, (error, stdout, stderr) => {
        if (error) {
          resolve({
            available: false,
            error: error.message,
            message: 'Cloudflared not found. Please install cloudflared.exe'
          });
        } else {
          resolve({
            available: true,
            version: stdout.trim(),
            message: 'Cloudflared is available'
          });
        }
      });
    });
  }
}

module.exports = new CloudflareTunnelService();
