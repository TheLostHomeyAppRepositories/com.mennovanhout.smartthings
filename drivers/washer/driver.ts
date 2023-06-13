import Homey from 'homey';
import axios from 'axios';

class MyDriver extends Homey.Driver {

  _deviceJobStateBecame: any;

  async onInit() {
    this._deviceJobStateBecame = this.homey.flow.getDeviceTriggerCard('washer_job_state_became');
  }

  async onPairListDevices() {
    const token = this.homey.settings.get('token');

    const response = await axios.get('https://api.smartthings.com/v1/devices?capability=washerOperatingState', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.items.map((item: any) => {
      return {
        name: item.label,
        data: {
          id: item.deviceId,
        },
      };
    });
  }

  triggerDeviceJobStateBecameFlow(device: any, tokens: any, state: any) {
    this._deviceJobStateBecame.trigger(device, tokens, state)
      .then(this.log)
      .catch(this.error);
  }

}

module.exports = MyDriver;
