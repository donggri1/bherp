import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('app_settings')
@Index(['companyId', 'settingKey'], { unique: true })
export class AppSetting extends CompanyBaseEntity {
  @Column({ length: 100 })
  settingKey: string;

  @Column({ type: 'simple-json' })
  settingValue: unknown;
}
