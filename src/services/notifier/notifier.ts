/**
 * Multi-channel notification service that can send messages via Discord, email, SMS, etc.
 * Designed to be extensible for adding new notification channels.
 */

import { DiscordNotifier } from './discord';
import { getMessage, MessagePaths, MessageValue } from './messages';

/**
 * Main notification orchestrator that manages multiple notification channels.
 * Currently supports Discord with fallback to console logging.
 */
export class Notifier {
  /**
   * Creates a notifier instance with optional Discord integration.
   * 
   * @param discord Optional Discord notifier instance
   */
  constructor(private discord?: DiscordNotifier) { }

  /**
   * Sends a structured notification message to all configured channels.
   * Falls back to console logging if no channels are configured.
   * 
   * @param path Structured notification with title, content, and optional metadata
   * @returns Promise<void>
   */
  async notify<T extends MessagePaths>(path: T, data: Parameters<MessageValue<T>>[0]): Promise<void> {
    const notificationMessage = getMessage(path);
    if (!notificationMessage) {
      console.warn('Notification message not found for path:', path);
      return;
    }

    const message = notificationMessage(data as any);

    const promises: Promise<void>[] = [];

    // Send to all configured channels
    if (this.discord) promises.push(this.discord.sendMessage(message));

    // Send to other services (email, SMS, etc.) here in the future
    
    // Log to console as fallback
    if (promises.length === 0) {
      console.log('[NOTIFICATION]', message.title, '-', message.content);
    }

    // Wait for all notifications to complete
    await Promise.allSettled(promises);
  }

  /**
   * Sends a simple text notification to all configured channels.
   * 
   * @param content Simple text message to send
   * @returns Promise<void>
   */
  async notifySimple(content: string): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.discord) promises.push(this.discord.sendSimpleMessage(content));

    if (promises.length === 0) {
      console.log('[NOTIFICATION]', content);
    }

    await Promise.allSettled(promises);
  }

  /**
   * Disconnects all active notification channels.
   * Should be called during application shutdown.
   */
  disconnect(): void {
    if (this.discord) {
      this.discord.disconnect();
    }
  }
}