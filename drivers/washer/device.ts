import Homey from 'homey';
import axios from 'axios';

class Device extends Homey.Device {

  updateInformation() {
    const token = this.homey.settings.get('token');
    const { id } = this.getData();

    axios.get(`https://api.smartthings.com/v1/devices/${id}/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      this.setCapabilityValue('washer_job_state', response.data.components.main.washerOperatingState.washerJobState.value).catch(this.error);
      this.setCapabilityValue('washer_job_state', 'spin').catch(this.error);
      this.setCapabilityValue('washer_machine_state', response.data.components.main.washerOperatingState.machineState.value).catch(this.error);
    });
  }

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    const device = this;

    this.registerCapabilityListener('washer_job_state', async (value, opts) => {
      this.log('value', value);
      this.log('opts', opts);
    });

    // this.registerCapabilityListener('washer_job_state', async (value: any, opts: any) => {
    //   this.log(value);
    //   device.log(value);
    //   device.log('TEST!');
    //   this.log(opts);
    //   device.log(opts);
    //
    //   // @ts-ignore
    //   this.driver.triggerDeviceJobStateBecameFlow(device, {
    //     washer_job_state: value,
    //   }, {});
    // });

    this.updateInformation();

    setInterval(() => this.updateInformation(), 3000);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }

}

module.exports = Device;
