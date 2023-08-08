import Homey from 'homey';

class Device extends Homey.Device {

  // @ts-ignore
  private interval: NodeJS.Timer;

  async updateInformation() {
    const { id } = this.getData();

    // @ts-ignore
    this.driver.deviceAPI.devices.getStatus(id).then((status) => {
      const oldDryerJobState = this.getCapabilityValue('dryer_job_state');
      const oldDryerMachineState = this.getCapabilityValue('dryer_machine_state');
      const dryerJobState = status.components.main.dryerOperatingState.dryerJobState.value;
      const dryerMachineState = status.components.main.dryerOperatingState.machineState.value;

      this.setCapabilityValue('dryer_job_state', dryerJobState).catch(this.error);
      this.setCapabilityValue('dryer_machine_state', dryerMachineState).catch(this.error);

      if (oldDryerJobState !== dryerJobState) {
        // @ts-ignore
        this.driver.triggerDryerJobBecameFlow(this, {
          dryer_job_state: dryerJobState,
        }, {
          dryer_job_state: dryerJobState,
        });
      }

      if (oldDryerMachineState !== dryerMachineState) {
        // @ts-ignore
        this.driver.triggerDryerStateBecameFlow(this, {
          dryer_machine_state: dryerMachineState,
        }, {
          dryer_machine_state: dryerMachineState,
        });
      }
    }).catch((error: any) => {
      if (error.response?.status === 403) {
        this.setUnavailable('Device unavailable');

        return;
      }
      this.log(error, 'something went wrong while updating information');
    });
  }

  async onInit() {
    this.driver.ready().then(() => {
      this.updateInformation();

      this.interval = setInterval(() => this.updateInformation(), 5000);
    });
  }

  async onDeleted() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

}

module.exports = Device;
