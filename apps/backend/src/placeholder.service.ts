function Injectable(): ClassDecorator {
  return (target) => target;
}

@Injectable()
export class PlaceholderService {
  getStatus(): string {
    return "backend placeholder — will be replaced by real Nest providers";
  }
}
