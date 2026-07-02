import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: configService.get<string>('jwt.refreshSecret', 'change_me_refresh_secret'),
    });
  }

  validate(req: Request, payload: { sub: number; companyId: number; loginId: string }) {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();
    return {
      userId: payload.sub,
      companyId: payload.companyId,
      loginId: payload.loginId,
      refreshToken,
    };
  }
}
