// standup-notifier.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { App, LogLevel } from '@slack/bolt';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import axios from 'axios';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class StandupNotifierService implements OnModuleInit {
  private app: App;
  private notifiedToday = new Set<string>();

  async onModuleInit() {
    this.app = new App({
      token: process.env.BOT_TOKEN,
      appToken: process.env.APP_TOKEN,
      socketMode: true,
      logLevel: LogLevel.INFO,
    });

    // Ascolta i messaggi nel canale standup-meeting
    this.app.message(async ({ message, say }) => {
      const userId = (message as any).user;
      const text = (message as any).text;
      const channel = (message as any).channel;

      const today = dayjs().format('YYYY-MM-DD');
      const key = `${userId}_${today}`;

      // Ignora se già notificato oggi o se non è un giorno lavorativo
      if (this.notifiedToday.has(key) || !this.isWeekday()) return;

      // Aggiunge alla lista dei notificati
      this.notifiedToday.add(key);

      // Countdown 9h
      setTimeout(
        async () => {
          await this.app.client.chat.postMessage({
            channel: userId,
            text: ':alert: Giornata lavorativa conclusa! Bravo/a 💪',
          });
        },
        // 9 ore
        9 * 60 * 60 * 1000,
        // per testare velocemente manda messaggio dopo 9 secondi
        // 9 * 1000,
      );

      console.log(`[STANDUP] Countdown iniziato per ${userId}`);
    });

    this.app.command('/partita', async ({ command, ack, respond }) => {
      await ack();

      const BOT_TOKEN = process.env.BOT_TOKEN;
      const textTokens = command.text.trim().split(/\s+/);

      const mentionRegex = /^<@([A-Z0-9]+)>$/;
      const mentions: string[] = [];
      const usernames: string[] = [];
      const simpleNames: string[] = [];

      for (const token of textTokens) {
        if (mentionRegex.test(token)) {
          mentions.push(token.replace(/[<@>]/g, ''));
        } else if (token.startsWith('@')) {
          usernames.push(token);
        } else {
          simpleNames.push(token);
        }
      }

      const resolvedIds = await this.resolveUsernamesToIds(
        usernames,
        BOT_TOKEN!,
      );

      const slackUsers = [...mentions, ...resolvedIds];
      const allPlayers = [
        ...slackUsers.map((id) => `<@${id}>`),
        ...simpleNames,
      ];

      if (allPlayers.length < 4) {
        return respond({
          response_type: 'ephemeral',
          text: '❗ Servono almeno 4 nomi o menzioni per iniziare una partita!',
        });
      }

      const shuffled = allPlayers.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 4);

      const gialli = selected.slice(0, 2);
      const blu = selected.slice(2, 4);

      const message = `🎲 Partita:\n👕 *Squadra Gialli*: ${gialli.join(', ')}\n👕 *Squadra Blu*: ${blu.join(', ')}`;

      // Pubblica messaggio nel canale
      await this.app.client.chat.postMessage({
        channel: command.channel_id,
        text: message,
      });

      // Notifica privata agli utenti menzionati
      for (const entry of selected) {
        const idMatch = entry.match(/^<@([A-Z0-9]+)>$/);
        if (idMatch) {
          const userId = idMatch[1];
          await this.app.client.chat.postMessage({
            channel: userId,
            text: `👋 Sei stato selezionato per la partita! Buona fortuna!`,
          });
        }
      }

      return respond({ text: `✅ Partita creata e giocatori notificati.` });
    });

    await this.app.start();
    console.log('✅ StandupNotifierService attivo in Socket Mode!');
  }

  private isWeekday(): boolean {
    const day = dayjs().tz('Europe/Rome').day(); // 0 = Domenica, 1 = Lunedì, ...
    return day >= 1 && day <= 5;
  }

  private async resolveUsernamesToIds(
    usernames: string[],
    token: string,
  ): Promise<string[]> {
    if (usernames.length === 0) return [];

    const res = await this.app.client.users.list({ token });

    if (!res.ok || !res.members) {
      console.error('Errore Slack users.list:', res);
      return [];
    }

    return usernames
      .map((name) => name.replace(/^@/, '').toLowerCase())
      .map((cleanName) => {
        const match = res.members!.find(
          (m: any) =>
            m.name.toLowerCase() === cleanName ||
            m.profile?.display_name?.toLowerCase() === cleanName,
        );
        return match?.id;
      })
      .filter(Boolean) as string[];
  }
}
