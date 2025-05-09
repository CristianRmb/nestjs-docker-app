import { Controller, Post, Req, Res } from '@nestjs/common';
import { SlackService } from './slack.service';
import { Response } from 'express';
import axios from 'axios';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  // @Post('partita')
  // handleSlashCommand(
  //   @Req() req: { body: { text: string; user_name: string } },
  //   @Res() res: Response,
  // ) {
  //   const { text, user_name } = req.body;

  //   // text contiene i nomi separati da spazio: "mario luca anna giulia giorgio"
  //   const names = text.split(' ').filter((n: string) => n.trim());
  //   if (names.length < 4) {
  //     return res.json({
  //       response_type: 'ephemeral',
  //       text: `Ciao ${user_name}, servono almeno 4 nomi per fare una partita!`,
  //     });
  //   }

  //   // Mischia e prendi 4 nomi
  //   const shuffled = names.sort(() => 0.5 - Math.random());
  //   const selected = shuffled.slice(0, 4);

  //   // Crea due squadre
  //   const gialli = selected.slice(0, 2);
  //   const blu = selected.slice(2, 4);

  //   return res.json({
  //     response_type: 'in_channel', // o 'ephemeral' se vuoi mostrare solo all'utente
  //     text: `🎲 Partita:\n👕 Squadra Gialli: ${gialli.join(', ')}\n👕 Squadra Blu: ${blu.join(', ')}`,
  //   });
  // }

  // @Post('test-partita')
  // async handlePartita(@Req() req) {
  //   const body = req.body;
  //   const BOT_TOKEN = process.env.BOT_TOKEN;

  //   console.log('body', body);

  //   // Estrai le vere menzioni Slack <@UXXXX>
  //   const idMatches = body.text.match(/<@([A-Z0-9]+)>/g) || [];

  //   // Estrai eventuali @username scritti a mano (es: @loris.oppia)
  //   const rawNames = body.text
  //     .split(/\s+/)
  //     .filter((s: string) => s.startsWith('@') && !s.startsWith('<@'));

  //   // Risolvi i @username → user_id
  //   const resolvedIds = await this.resolveUsernamesToIds(
  //     rawNames,
  //     BOT_TOKEN as string,
  //   );

  //   const allUserIds = [
  //     ...idMatches.map((id) => id.replace(/[<@>]/g, '')),
  //     ...resolvedIds,
  //   ];

  //   if (allUserIds.length < 4) {
  //     return {
  //       response_type: 'ephemeral',
  //       text: '❗ Servono almeno 4 menzioni (usa @utente o seleziona con TAB)',
  //     };
  //   }

  //   // Shuffle
  //   const shuffled = allUserIds.sort(() => 0.5 - Math.random()).slice(0, 4);

  //   const formatted = shuffled.map((id) => `<@${id}>`).join(' ');
  //   const channelText = `🎲 Giocano: ${formatted}`;

  //   // Messaggio nel canale
  //   await axios.post(
  //     'https://slack.com/api/chat.postMessage',
  //     {
  //       channel: body.channel_id,
  //       text: channelText,
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${BOT_TOKEN}`,
  //         'Content-Type': 'application/json',
  //       },
  //     },
  //   );

  //   // Messaggi privati
  //   for (const id of shuffled) {
  //     await axios.post(
  //       'https://slack.com/api/chat.postMessage',
  //       {
  //         channel: id,
  //         text: `👋 Sei stato selezionato per la partita!`,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${BOT_TOKEN}`,
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );
  //   }

  //   return { text: `✅ Giocatori notificati.` };
  // }

  @Post('/partita')
  async handlePartita(@Req() req, @Res() res: Response) {
    const body = req.body;
    const BOT_TOKEN = process.env.BOT_TOKEN;

    const textTokens = body.text.trim().split(/\s+/);

    const mentionRegex = /^<@([A-Z0-9]+)>$/;
    const mentions: string[] = []; // Slack IDs es: ['U01...']
    const usernames: string[] = []; // es: ['@loris.oppia']
    const simpleNames: string[] = []; // es: ['Loris']

    // Classifica i token
    for (const token of textTokens) {
      if (mentionRegex.test(token)) {
        mentions.push(token.replace(/[<@>]/g, ''));
      } else if (token.startsWith('@')) {
        usernames.push(token);
      } else {
        simpleNames.push(token);
      }
    }

    // Risolvi gli @username scritti a mano → Slack IDs
    const resolvedIds = await this.resolveUsernamesToIds(
      usernames,
      BOT_TOKEN as string,
    );

    // Crea lista completa dei partecipanti
    const slackUsers = [...mentions, ...resolvedIds]; // validi per notifica
    const allPlayers = [...slackUsers.map((id) => `<@${id}>`), ...simpleNames];

    if (allPlayers.length < 4) {
      return res.json({
        response_type: 'ephemeral',
        text: '❗ Servono almeno 4 nomi o menzioni per iniziare una partita!',
      });
    }

    // Mischia e prendi i primi 4
    const shuffled = allPlayers.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);

    // Squadre
    const gialli = selected.slice(0, 2);
    const blu = selected.slice(2, 4);

    const message = `🎲 Partita:\n👕 *Squadra Gialli*: ${gialli.join(', ')}\n👕 *Squadra Blu*: ${blu.join(', ')}`;

    // Messaggio pubblico nel canale
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: body.channel_id,
        text: message,
      },
      {
        headers: {
          Authorization: `Bearer ${BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // Notifica solo ai validi (Slack IDs) che sono stati selezionati
    for (const entry of selected) {
      const idMatch = entry.match(/^<@([A-Z0-9]+)>$/);
      if (idMatch) {
        const userId = idMatch[1];
        await axios.post(
          'https://slack.com/api/chat.postMessage',
          {
            channel: userId,
            text: `👋 Sei stato selezionato per la partita! Buona fortuna!`,
          },
          {
            headers: {
              Authorization: `Bearer ${BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
          },
        );
      }
    }

    return res.json({ text: `✅ Partita creata e giocatori notificati.` });
  }

  async resolveUsernamesToIds(
    usernames: string[],
    token: string,
  ): Promise<string[]> {
    if (usernames.length === 0) return [];

    const res = await axios.get('https://slack.com/api/users.list', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.data.ok) {
      console.error('Errore Slack users.list:', res.data);
      return [];
    }

    const members = res.data.members;

    // Pulisce la @ davanti e fa il match su name o display_name
    return usernames
      .map((name) => name.replace(/^@/, '').toLowerCase())
      .map((cleanName) => {
        const match = members.find(
          (m: any) =>
            m.name.toLowerCase() === cleanName ||
            m.profile?.display_name?.toLowerCase() === cleanName,
        );
        return match?.id;
      })
      .filter(Boolean);
  }
}
