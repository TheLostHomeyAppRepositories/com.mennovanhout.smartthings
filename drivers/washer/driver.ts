import Homey from 'homey';
import { BearerTokenAuthenticator, SmartThingsClient } from '@smartthings/core-sdk';

class Driver extends Homey.Driver {

  private _deviceJobStateBecame: any;
  // @ts-ignore
  public deviceAPI: SmartThingsClient;

  async onInit() {
    this.deviceAPI = new SmartThingsClient(new BearerTokenAuthenticator(this.homey.settings.get('token')));
  }

  async onPairListDevices() {
    const devices = await this.deviceAPI.devices.list({
      capability: 'washerOperatingState',
    });

    return devices.map((item: any) => {
      return {
        name: item.label,
        data: {
          id: item.deviceId,
        },
      };
    });
  }

}

module.exports = Driver;
