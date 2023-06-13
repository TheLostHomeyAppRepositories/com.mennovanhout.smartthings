import Homey from 'homey';

class MyApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    const token = this.homey.settings.get('token');
  }

}

module.exports = MyApp;
