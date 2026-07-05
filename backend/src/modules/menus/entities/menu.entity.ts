import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('menus')
export class Menu extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 80 })
  menuCode: string;

  @Column({ length: 100 })
  menuName: string;

  @Column({ length: 50 })
  menuGroupCode: string;

  @Column({ length: 180 })
  path: string;

  @Column({ nullable: true })
  parentId?: number | null;

  @ManyToOne(() => Menu, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent?: Menu | null;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ length: 50, nullable: true })
  icon?: string;

  @Column({ default: true })
  isActive: boolean;
}
