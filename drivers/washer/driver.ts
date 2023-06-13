import Homey from 'homey';
import axios from 'axios';

class MyDriver extends Homey.Driver {

  async onInit() {
    this.log('MyDriver has been initialized');
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

}

module.exports = MyDriver;
