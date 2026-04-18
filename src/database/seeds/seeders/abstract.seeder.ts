


export abstract class AbstractSeeder {


  abstract run(): Promise<void>;


  protected log(message: string, status: "skipped" | "seeded" | "error") {

    console.log(`${status} ${this.constructor.name} ${message}`)
  }
}