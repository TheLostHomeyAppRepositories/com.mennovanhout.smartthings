import Homey from 'homey';
import SmartThingsDriver from '../../shared/SmartThingsDriver';

class Device extends Homey.Device {

  // @ts-ignore
  driver: SmartThingsDriver;

  // @ts-ignore
  private interval: NodeJS.Timer;

  public startUpdateInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => this.updateInformation(), 5000);
  }

  async updateInformation() {
    const { id } = this.getData();

    this.driver.deviceAPI.devices.getStatus(id).then(async (status) => {
      // Current temperature
      const temperatureMeasurement = status.components!.main.temperatureMeasurement.temperature.value;
      const thermostatCoolingSetpoint = status.components!.main.thermostatCoolingSetpoint.coolingSetpoint.value;
      const humidity = status.components!.main.relativeHumidityMeasurement.humidity.value;
      const airConditionMode = status.components?.main.airConditionerMode?.airConditionerMode?.value;
      const oldAirConditioningMode = this.getCapabilityValue('air_conditioning_mode');
      const isDeviceOn = status.components?.main.switch?.switch?.value === 'on';
      const oldFanOscillationMode = this.getCapabilityValue('air_conditioning_fan_oscillation_mode');
      const fanOscillationMode = status.components?.main?.fanOscillationMode?.fanOscillationMode?.value;
      const oldFanMode = this.getCapabilityValue('air_conditioning_fan_mode');
      const fanMode = status.components?.main?.airConditionerFanMode?.fanMode?.value;

      this.setCapabilityValue('measure_temperature', temperatureMeasurement).catch(this.error);
      this.setCapabilityValue('target_temperature', thermostatCoolingSetpoint).catch(this.error);
      this.setCapabilityValue('onoff', isDeviceOn).catch(this.error);
      this.setCapabilityValue('measure_humidity', humidity);

      // When air condition mode is reported
      if (airConditionMode) {
        if (!this.hasCapability('air_conditioning_mode')) {
          await this.addCapability('air_conditioning_mode');
        }

        await this.setCapabilityValue('air_conditioning_mode', airConditionMode);

        if (oldAirConditioningMode !== airConditionMode) {
          // @ts-ignore
          this.driver.triggerAirConditioningModeBecameFlow(this, {
            air_conditioning_mode: airConditionMode,
          }, {
            air_conditioning_mode: airConditionMode,
          });
        }
      }

      // When fanOscillationMode is reported
      if (fanOscillationMode) {
        if (!this.hasCapability('air_conditioning_fan_oscillation_mode')) {
          await this.addCapability('air_conditioning_fan_oscillation_mode');
        }

        await this.setCapabilityValue('air_conditioning_fan_oscillation_mode', fanOscillationMode);

        if (oldFanMode !== fanMode) {
          // @ts-ignore
          this.driver.triggerAirConditioningFanModeBecameFlow(this, {
            air_conditioning_fan_mode: fanMode,
          }, {
            air_conditioning_fan_mode: fanMode,
          });
        }
      }

      // When fanMode is reported
      if (fanMode) {
        if (!this.hasCapability('air_conditioning_fan_mode')) {
          await this.addCapability('air_conditioning_fan_mode');
        }

        await this.setCapabilityValue('air_conditioning_fan_mode', fanMode);

        if (oldFanOscillationMode !== fanOscillationMode) {
          // @ts-ignore
          this.driver.triggerAirConditioningFanOscillationModeBecameFlow(this, {
            air_conditioning_fan_oscillation_mode: fanOscillationMode,
          }, {
            air_conditioning_fan_oscillation_mode: fanOscillationMode,
          });
        }
      }
    }).catch((error: any) => {
      this.log(error, 'something went wrong while updating information');
    });
  }

  async onInit() {
    const { id } = this.getData();

    this.driver.ready().then(() => {
      this.startUpdateInterval();

      // When temperature changes
      this.registerCapabilityListener('target_temperature', (temperature) => {
        this.setCapabilityValue('target_temperature', temperature).catch(this.error);

        this.startUpdateInterval();

        this.driver.deviceAPI.devices.executeCommand(id, {
          capability: 'thermostatCoolingSetpoint',
          command: 'setCoolingSetpoint',
          arguments: [temperature],
        }).then((response) => {
          this.log(response);
        }).catch((error: any) => {
          this.log(error, error.response);
        });
      });

      // Different air condition mode
      this.registerCapabilityListener('air_conditioning_mode', (newMode) => {
        // @ts-ignore
        this.driver.setMyAirConditioningMode(id, newMode);
      });

      // Different fan mode
      this.registerCapabilityListener('air_conditioning_fan_mode', (newMode) => {
        // @ts-ignore
        this.driver.setMyAirConditioningFanMode(id, newMode);
      });

      // Different fan oscillation mode
      this.registerCapabilityListener('air_conditioning_fan_oscillation_mode', (newMode) => {
        // @ts-ignore
        this.driver.setMyAirConditioningFanOscillationMode(id, newMode);
      });

      // When turned on/off
      this.registerCapabilityListener('onoff', (on) => {
        this.setCapabilityValue('onoff', on).catch(this.error);

        this.startUpdateInterval();

        this.driver.deviceAPI.devices.executeCommand(id, {
          capability: 'switch',
          command: on ? 'on' : 'off',
        }).then((response) => {
          this.log(response);
        }).catch((error: any) => {
          this.log(error, error.response);
        });
      });
    });
  }

  async onDeleted() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

}

module.exports = Device;
