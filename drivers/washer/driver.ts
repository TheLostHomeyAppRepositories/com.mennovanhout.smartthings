import Homey, { FlowCardAction, FlowCardCondition, FlowCardTriggerDevice } from 'homey';
import { BearerTokenAuthenticator, SmartThingsClient } from '@smartthings/core-sdk';
import SmartThingsDriver from '../../shared/SmartThingsDriver';
import { getLogicalName } from './SamsungceWashingCycle';

class Driver extends SmartThingsDriver {

  private _deviceJobStateBecame: FlowCardTriggerDevice|undefined;
  private _deviceMachineStateBecame: FlowCardTriggerDevice|undefined;
  private _deviceIsDoingJob: FlowCardCondition|undefined;
  private _deviceIsInState: FlowCardCondition|undefined;
  private _setWashingProgram: FlowCardAction|undefined;
  private _setWasherMachineState: FlowCardAction|undefined;

  async onInit() {
    this.requiredCapabilities = ['washerOperatingState'];

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

    // Set washing program
    this._setWashingProgram = this.homey.flow.getActionCard('set-washing-program');
    this._setWashingProgram.registerArgumentAutocompleteListener('program', async (query, args) => {
      const results = args.device.supportedWashingPrograms.map((program: string) => {
        return {
          name: getLogicalName(program),
          id: program,
        };
      });

      return results.filter((result: any) => {
        return result.name.toLowerCase().includes(query.toLowerCase());
      });
    });
    this._setWashingProgram.registerRunListener(async (args, state) => {
      await this.setWashingProgram(args.device, args.program);
    });

    // Set waching machine state
    this._setWasherMachineState = this.homey.flow.getActionCard('set-washer-machine-state');
    this._setWasherMachineState.registerRunListener(async (args, state) => {
      await this.setWashingMachineState(args.device, args.washer_machine_state);
    });

    this.deviceAPI = new SmartThingsClient(new BearerTokenAuthenticator(this.homey.settings.get('token')));
  }

  setWashingProgram(device: Homey.Device, program: { id: string; }) {
    return new Promise((resolve, reject) => {
      this.deviceAPI.devices.executeCommand(device.getData().id, {
        capability: 'samsungce.washerCycle',
        command: 'setWasherCycle',
        arguments: [`Course_${program.id.slice(program.id.lastIndexOf('_') + 1)}`],
      }).then((responese: any) => {
        this.log(responese);
        resolve(true);
      }).catch((error: any) => {
        this.log(error, error.response);
        reject();
      });
    });
  }

  setWashingMachineState(device: Homey.Device, state: string) {
    return new Promise((resolve, reject) => {
      this.deviceAPI.devices.executeCommand(device.getData().id, {
        capability: 'washerOperatingState',
        command: 'setMachineState',
        arguments: [state],
      }).then((responese: any) => {
        this.log(responese);
        resolve(true);
      }).catch((error: any) => {
        this.log(error, error.response);
        reject();
      });
    });
  }

  triggerWasherJobBecameFlow(device: Homey.Device, tokens: any, state:any) {
    this._deviceJobStateBecame?.trigger(device, tokens, state).then(this.log).catch(this.error);
  }

  triggerWasherStateBecameFlow(device: Homey.Device, tokens: any, state:any) {
    this._deviceMachineStateBecame?.trigger(device, tokens, state).then(this.log).catch(this.error);
  }

}

module.exports = Driver;
