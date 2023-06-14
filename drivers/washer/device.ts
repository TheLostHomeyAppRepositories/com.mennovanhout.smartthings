import Homey from 'homey';

class Device extends Homey.Device {

  // @ts-ignore
  private interval: NodeJS.Timer;

  async updateInformation() {
    const { id } = this.getData();

    // @ts-ignore
    const status = await this.driver.deviceAPI.devices.getStatus(id);

    const washerJobState = status.components.main.washerOperatingState.washerJobState.value;
    const washerMachineState = status.components.main.washerOperatingState.machineState.value;

    this.setCapabilityValue('washer_job_state', washerJobState).catch(this.error);
    this.setCapabilityValue('washer_machine_state', washerMachineState).catch(this.error);
  }

  async onInit() {
    this.driver.ready().then(() => {
      this.updateInformation();

      this.interval = setInterval(() => this.updateInformation(), 3000);
    });
  }

  async onDeleted() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

}

module.exports = Device;
