import Homey from 'homey';

class Device extends Homey.Device {

  // @ts-ignore
  private interval: NodeJS.Timer;

  async updateInformation() {
    const { id } = this.getData();

    // @ts-ignore
    const status = await this.driver.deviceAPI.devices.getStatus(id);

    const oldWasherJobState = this.getCapabilityValue('washer_job_state');
    const oldWasherMachineState = this.getCapabilityValue('washer_machine_state');
    const washerJobState = status.components.main.washerOperatingState.washerJobState.value;
    const washerMachineState = status.components.main.washerOperatingState.machineState.value;

    this.setCapabilityValue('washer_job_state', washerJobState).catch(this.error);
    this.setCapabilityValue('washer_machine_state', washerMachineState).catch(this.error);

    if (oldWasherJobState !== washerJobState) {
      // @ts-ignore
      this.driver.triggerWasherJobBecameFlow(this, {
        washer_job_state: washerJobState,
      }, {
        washer_job_state: washerJobState,
      });
    }

    if (oldWasherMachineState !== washerMachineState) {
      // @ts-ignore
      this.driver.triggerWasherStateBecameFlow(this, {
        washer_machine_state: washerMachineState,
      }, {
        washer_machine_state: washerMachineState,
      });
    }
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
