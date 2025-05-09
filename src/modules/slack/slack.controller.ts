import { Controller, Post, Req, Res } from '@nestjs/common';
import { SlackService } from './slack.service';
import { Response } from 'express';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Post('partita')
  handleSlashCommand(
    @Req() req: { body: { text: string; user_name: string } },
    @Res() res: Response,
  ) {
    const { text, user_name } = req.body;

    // text contiene i nomi separati da spazio: "mario luca anna giulia giorgio"
    const names = text.split(' ').filter((n: string) => n.trim());
    if (names.length < 4) {
      return res.json({
        response_type: 'ephemeral',
        text: `Ciao ${user_name}, servono almeno 4 nomi per fare una partita!`,
      });
    }

    // Mischia e prendi 4 nomi
    const shuffled = names.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);

    // Crea due squadre
    const gialli = selected.slice(0, 2);
    const blu = selected.slice(2, 4);

    return res.json({
      response_type: 'in_channel', // o 'ephemeral' se vuoi mostrare solo all'utente
      text: `🎲 Partita:\n👕 Squadra Gialli: ${gialli.join(', ')}\n👕 Squadra Blu: ${blu.join(', ')}`,
    });
  }
}
