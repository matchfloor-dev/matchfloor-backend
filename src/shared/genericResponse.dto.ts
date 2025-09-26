export class GenericResponse<T> {
  statusCode: number;

  status: string;

  data: T;

  constructor(data: T, status = 'success') {
    this.status = status;
    this.data = data;
  }
}
