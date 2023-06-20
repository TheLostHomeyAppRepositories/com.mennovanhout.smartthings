import Homey from 'homey';
import { BearerTokenAuthenticator, SmartThingsClient } from '@smartthings/core-sdk';

class SmartThingsDriver extends Homey.Driver {

  // @ts-ignore
  public deviceAPI: SmartThingsClient;

  protected requiredCapabilities: string[] = [];

  async onPair(session: any) {
    session.setHandler('showView', async (view: string) => {
      if (view === 'loading') {
        try {
          await this.deviceAPI.devices.list();

          await session.showView('list_devices');
        } catch (error: any) {
          await session.showView('personal-access-token');
        }
      }

      if (view === 'personal-access-token') {
        const token = this.homey.settings.get('token');

        await session.emit('token', token);
      }
    });

    // When personal access token is entered
    session.setHandler('save-token', async (token: string) => {
      this.homey.settings.set('token', token);

      this.deviceAPI = new SmartThingsClient(new BearerTokenAuthenticator(token));

      await session.showView('list_devices');
    });

    // When personal access token is accepted
    session.setHandler('list_devices', async () => {
      let devices: any[] = [];

      devices = await this.deviceAPI.devices.list({
        capability: this.requiredCapabilities,
      });

      return devices.map((item: any) => {
        return {
          name: item.label,
          data: {
            id: item.deviceId,
          },
        };
      });
    });
  }

}

export default SmartThingsDriver;
