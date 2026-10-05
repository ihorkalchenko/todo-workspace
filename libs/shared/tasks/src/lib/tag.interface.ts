export interface Tag {
  readonly id: number;
  readonly name: string;
  readonly color: string;
  readonly userId: number;
}

export interface CreateTagDto {
  readonly name: string;
  readonly color: string;
}

export interface UpdateTagDto extends Partial<CreateTagDto> {}
