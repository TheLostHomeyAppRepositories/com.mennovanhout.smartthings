import Homey, { FlowCardCondition, FlowCardTriggerDevice } from 'homey';
import { BearerTokenAuthenticator, SmartThingsClient } from '@smartthings/core-sdk';

class Driver extends Homey.Driver {

  // @ts-ignore
  private _deviceJobStateBecame: FlowCardTriggerDevice;
  // @ts-ignore
  private _deviceMachineStateBecame: FlowCardTriggerDevice;
  // @ts-ignore
  private _deviceIsDoingJob: FlowCardCondition;
  // @ts-ignore
  private _deviceIsInState: FlowCardCondition;
  // @ts-ignore
  public deviceAPI: SmartThingsClient;

  async onInit() {
    // When washer job became flow card
    this._deviceJobStateBecame = this.homey.flow.getDeviceTriggerCard('when-the-washer-job-became');
    this._deviceJobStateBecame.registerRunListener(async (args, state) => {
      return args.washer_job_state === state.washer_job_state;
    });

    // When machine state became flow card
    this._deviceMachineStateBecame = this.homey.flow.getDeviceTriggerCard('when-the-washer-state-became');
    this._deviceMachineStateBecame.registerRunListener(async (args, state) => {
      return args.washer_machine_state === state.washer_machine_state;
    });

    // Is doing job ... flow card
    this._deviceIsDoingJob = this.homey.flow.getConditionCard('is-doing-job');
    this._deviceIsDoingJob.registerRunListener(async (args, state) => {
      return args.washer_job_state === args.device.getCapabilityValue('washer_job_state');
    });

    // Is in state ... flow card
    this._deviceIsInState = this.homey.flow.getConditionCard('is-in-state');
    this._deviceIsInState.registerRunListener(async (args, state) => {
      return args.washer_machine_state === args.device.getCapabilityValue('washer_machine_state');
    });

    this.deviceAPI = new SmartThingsClient(new BearerTokenAuthenticator(this.homey.settings.get('token')));
  }

  triggerWasherJobBecameFlow(device: Homey.Device, tokens: any, state:any) {
    this._deviceJobStateBecame.trigger(device, tokens, state).then(this.log).catch(this.error);
  }

  triggerWasherStateBecameFlow(device: Homey.Device, tokens: any, state:any) {
    this._deviceMachineStateBecame.trigger(device, tokens, state).then(this.log).catch(this.error);
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
