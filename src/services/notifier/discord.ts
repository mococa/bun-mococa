/**
 * Discord notification service for sending admin alerts and system notifications.
 * Provides both simple text messages and rich embed notifications.
 */

import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import type { NotificationMessage } from './messages';

/**
 * Discord bot configuration interface.
 */
export interface DiscordConfig {
  channelId?: string;
  botToken?: string;
}

/**
 * Discord notification service that sends messages to a configured Discord channel.
 * Handles bot authentication, connection management, and message formatting.
 */
export class DiscordNotifier {
  private client?: Client;
  private channelId?: string;
  private isReady = false;

  /**
   * Initializes Discord bot with configuration and establishes connection.
   * Gracefully handles missing configuration by logging warnings.
   * 
   * @param config Discord bot token and channel ID configuration
   */
  constructor(config: DiscordConfig) {
    if (!config.botToken || !config.channelId) {
      console.warn('Discord notifier not configured - missing bot token or channel ID');
      return;
    }

    this.channelId = config.channelId;
    
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    this.client.once('ready', () => {
      console.log('Discord notifier ready');
      this.isReady = true;
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

    // Login to Discord
    this.client.login(config.botToken).catch((error) => {
      console.error('Failed to login to Discord:', error);
    });
  }

  /**
   * Sends a rich notification message with embed formatting.
   * 
   * @param message Structured notification with title, content, and styling
   * @returns Promise<void>
   */
  async sendMessage(message: NotificationMessage): Promise<void> {
    if (!this.client || !this.channelId || !this.isReady) {
      console.warn('Discord notifier not ready or configured');
      return;
    }

    try {
      const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
      
      if (!channel) {
        console.error('Discord channel not found');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(message.title)
        .setDescription(message.content)
        .setColor(message.color || 0x0099ff)
        .setTimestamp(message.timestamp || new Date());

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error sending Discord message:', error);
    }
  }

  /**
   * Sends a simple text message to the Discord channel.
   * 
   * @param content Plain text message content
   * @returns Promise<void>
   */
  async sendSimpleMessage(content: string): Promise<void> {
    if (!this.client || !this.channelId || !this.isReady) {
      console.warn('Discord notifier not ready or configured');
      return;
    }

    try {
      const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
      
      if (!channel) {
        console.error('Discord channel not found');
        return;
      }

      await channel.send(content);
    } catch (error) {
      console.error('Error sending Discord message:', error);
    }
  }

  /**
   * Disconnects the Discord bot client.
   * Should be called during application shutdown.
   */
  disconnect(): void {
    if (this.client) {
      this.client.destroy();
    }
  }
}