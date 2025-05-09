// standup-notifier.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { App, LogLevel } from '@slack/bolt';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

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
            text: '⏰ Giornata lavorativa conclusa! Bravo/a 💪',
          });
        },
        9 * 60 * 60 * 1000,
      ); // 9 ore

      console.log(`[STANDUP] Countdown iniziato per ${userId}`);
    });

    await this.app.start();
    console.log('✅ StandupNotifierService attivo in Socket Mode!');
  }

  private isWeekday(): boolean {
    const day = dayjs().tz('Europe/Rome').day(); // 0 = Domenica, 1 = Lunedì, ...
    return day >= 1 && day <= 5;
  }
}
