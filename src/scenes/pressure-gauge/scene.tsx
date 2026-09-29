import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { getGasVelocity, isGasEmitting, ventGasProps } from './gas';
import { advanceDisplayedPressure, PRESSURE_VALUES } from './pressure';
import { ReplacementGauge } from './ReplacementGauge';
import { canOperateValve, INITIAL_SIMULATION_STATE, transitionSimulation } from './simulation';
import { recordTrainingStart, recordTrainingTransition } from './trainingEvents';
import { useConvaiTriggers } from './useConvaiTriggers';
import { Model as AvatarRodrigo } from '../../avatar/Avatar-rodrigo';
import { GltfModel } from '../../runtime/assets/GltfModel';
import { useEventLog } from '../../runtime/events/EventLogContext';
import { useAutomaticInput } from '../../runtime/input/useAutomaticInput';
import { usePlayer } from '../../runtime/player/PlayerContext';
import { ParticleEmitter } from '../../runtime/spark/ParticleEmitter';
import { SplatModel } from '../../runtime/spark/SplatModel';
import { useUI } from '../../runtime/ui/UIContext';

import type { Valve } from './pressure';
import type { SimulationAction } from './simulation';
import type { GltfModelHandle } from '../../runtime/assets/GltfAnimationController';

const SCENE_SPLATS_URL = `${import.meta.env.BASE_URL}scenes/pressure-gauge/splats-lod.rad`;
const SCENE_COLLIDERS_URL = `${import.meta.env.BASE_URL}scenes/pressure-gauge/colliders.glb`;
const DUTO_SEM_VALVULAS_URL = `${import.meta.env.BASE_URL}assets/duto_sem_valvulas.glb`;
const VOLANTE_ESQUERDO_URL = `${import.meta.env.BASE_URL}assets/volante_esquerdo.glb`;
const VOLANTE_DIREITO_URL = `${import.meta.env.BASE_URL}assets/volante_direito.glb`;
const MANOMETRO_URL = `${import.meta.env.BASE_URL}assets/manometro.glb`;
const VENTEIO_URL = `${import.meta.env.BASE_URL}assets/venteio.glb`;
const BOX_URL = `${import.meta.env.BASE_URL}assets/box.glb`;
const PLAYER_SPAWN_POSITION = [0, 0, 0] as const;
const AUTOMATIC_INPUT_IDLE_DELAY = 5;
const AUTOMATIC_YAW_INPUT_SPEED = 0.04;
const AUTOMATIC_PITCH_AMPLITUDE = THREE.MathUtils.degToRad(3);
const AUTOMATIC_PITCH_PERIOD = 5;
const AUTOMATIC_PITCH_RESPONSE = 4;
const AUTOMATIC_MAX_PITCH_SPEED = THREE.MathUtils.degToRad(15);
const MONTANTE_CLIP = 'Roda_Direita_Duas_Voltas.001';
const JUSANTE_CLIP = 'Roda_Duas_Voltas.001';
const VENTEIO_CLIP = 'CONTROLE_Alavanca_AnimadaAction.002';
const MANOMETRO_CLIP = 'Ponteiro_Inicio_Ao_Final';

export const PressureGaugeScene = () => {
  const { spawn, idleTime, getOrientation, setHeldItem } = usePlayer();
  const { showScreenFeedback } = useUI();
  const eventLog = useEventLog();
  const initialStateLogged = useRef(false);
  const automaticInput = useAutomaticInput();
  const automaticPitchPhaseRef = useRef(0);
  const [simulation, setSimulation] = useState(INITIAL_SIMULATION_STATE);
  
  useConvaiTriggers(simulation);
  
  const simulationRef = useRef(INITIAL_SIMULATION_STATE);
  const { stage, valves, pressureState, activeValve } = simulation;
  const montanteRef = useRef<GltfModelHandle>(null);
  const jusanteRef = useRef<GltfModelHandle>(null);
  const venteioRef = useRef<GltfModelHandle>(null);
  const installedGaugeRef = useRef<GltfModelHandle>(null);
  const displayedPressure = useRef(PRESSURE_VALUES.medium);

  useLayoutEffect(() => {
    const recordInitialState = () => {
      if (initialStateLogged.current || eventLog.getSnapshot().status !== 'active') return;
      initialStateLogged.current = true;
      recordTrainingStart(eventLog, INITIAL_SIMULATION_STATE);
    };
    const unsubscribe = eventLog.subscribe((event) => {
      if (event.type === 'session.started' && event.source === 'runtime.session') {
        recordInitialState();
      }
    });
    // Also handle mounting after readiness, without replaying any recorded events.
    recordInitialState();
    return unsubscribe;
  }, [eventLog]);

  const applyAction = (action: SimulationAction) => {
    if (action.type !== 'finish-valve' && eventLog.getSnapshot().status !== 'active') {
      return false;
    }
    const previous = simulationRef.current;
    const next = transitionSimulation(previous, action);

    if (next === previous) {
      return false;
    }

    // Update the guard synchronously, before React publishes new interaction props.
    simulationRef.current = next;
    setSimulation(next);
    recordTrainingTransition(eventLog, previous, next, action);

    if (previous.stage !== 'complete' && next.stage === 'complete') {
      showScreenFeedback('rgb(0 180 80 / 0.35)', 'Treinamento concluído', 'rgb(80 255 150)', 3);
    }

    return true;
  };

  useEffect(() => {
    setHeldItem(stage === 'collected' ? <ReplacementGauge carried /> : null);

    return () => {
      setHeldItem(null);
    };
  }, [setHeldItem, stage]);

  useLayoutEffect(() => {
    montanteRef.current?.setClipBehavior(MONTANTE_CLIP, { start: 1, speed: 0 });
    jusanteRef.current?.setClipBehavior(JUSANTE_CLIP, { start: 1, speed: 0 });
    venteioRef.current?.setClipBehavior(VENTEIO_CLIP, { start: 0, speed: 0 });
    installedGaugeRef.current?.setClipBehavior(MANOMETRO_CLIP, {
      start: PRESSURE_VALUES.medium,
      speed: 0,
    });
  }, []);

  const setValveOpen = (valve: Valve, open: boolean) => {
    const { model, clip, speed } = {
      montante: { model: montanteRef.current, clip: MONTANTE_CLIP, speed: 2 },
      jusante: { model: jusanteRef.current, clip: JUSANTE_CLIP, speed: 2 },
      venteio: { model: venteioRef.current, clip: VENTEIO_CLIP, speed: 1 },
    }[valve];

    if (!model || !applyAction({ type: 'set-valve', valve, open })) {
      return;
    }

    model.setClipBehavior(clip, {
      end: open ? 1 : 0,
      speed,
      onComplete: () => {
        applyAction({ type: 'finish-valve', valve });
      },
    });
  };

  useFrame((_state, delta) => {
    displayedPressure.current = advanceDisplayedPressure(
      displayedPressure.current,
      pressureState,
      delta,
    );
    installedGaugeRef.current?.setClipBehavior(MANOMETRO_CLIP, {
      start: displayedPressure.current,
      speed: 0,
    });
  });

  useFrame((_state, delta) => {
    if (idleTime < AUTOMATIC_INPUT_IDLE_DELAY) {
      automaticInput.setOrientationVelocity(0, 0, 0);

      return;
    }

    automaticPitchPhaseRef.current =
      (automaticPitchPhaseRef.current + (Math.PI * 2 * delta) / AUTOMATIC_PITCH_PERIOD) %
      (Math.PI * 2);

    const targetPitch = AUTOMATIC_PITCH_AMPLITUDE * Math.sin(automaticPitchPhaseRef.current);
    const pitchError = targetPitch - getOrientation().pitch;
    const responsivePitchStep = pitchError * (1 - Math.exp(-AUTOMATIC_PITCH_RESPONSE * delta));
    const maximumPitchStep = AUTOMATIC_MAX_PITCH_SPEED * delta;
    const pitchStep = THREE.MathUtils.clamp(
      responsivePitchStep,
      -maximumPitchStep,
      maximumPitchStep,
    );

    automaticInput.addOrientationDelta(pitchStep, 0, 0);
    automaticInput.setOrientationVelocity(0, AUTOMATIC_YAW_INPUT_SPEED, 0);
  });

  return (
    <group>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 10, -5]} />
      <directionalLight position={[10, 5, 5]} />
      <SplatModel url={SCENE_SPLATS_URL} paged onInitialized={() => spawn(PLAYER_SPAWN_POSITION)} />
      <GltfModel url={SCENE_COLLIDERS_URL} visible={false} physicality="fixed" />

      <AvatarRodrigo 
            position={[-2.0, 0.0, -0.4]} 
            rotation={[0, Math.PI / 3, 0]}
            scale={1} 
        />

      <group
        name="pressure-gauge-assembly"
        position={[4.8, 0.02, 2.6]}
        rotation={[0, -1.8, 0]}
        scale={0.3}
      >
        <GltfModel url={DUTO_SEM_VALVULAS_URL} />
        <GltfModel
          ref={jusanteRef}
          url={VOLANTE_ESQUERDO_URL}
          interaction={
            !canOperateValve(simulation, 'jusante')
              ? null
              : valves.jusante
                ? { label: 'Fechar jusante', action: () => setValveOpen('jusante', false) }
                : { label: 'Abrir jusante', action: () => setValveOpen('jusante', true) }
          }
        />
        <GltfModel
          ref={montanteRef}
          url={VOLANTE_DIREITO_URL}
          interaction={
            !canOperateValve(simulation, 'montante')
              ? null
              : valves.montante
                ? { label: 'Fechar montante', action: () => setValveOpen('montante', false) }
                : { label: 'Abrir montante', action: () => setValveOpen('montante', true) }
          }
        />
        <GltfModel
          ref={installedGaugeRef}
          url={MANOMETRO_URL}
          opacity={stage === 'removed' || stage === 'collected' ? 0 : 1}
          blocksInteractions={stage !== 'removed' && stage !== 'collected'}
          interaction={
            activeValve !== null
              ? null
              : stage === 'isolated'
                ? {
                    label: 'Remover manômetro',
                    action: () => applyAction({ type: 'remove-gauge' }),
                  }
                : stage === 'collected'
                  ? {
                      label: 'Instalar manômetro',
                      action: () => applyAction({ type: 'install-gauge' }),
                    }
                  : null
          }
        />
        <GltfModel
          ref={venteioRef}
          url={VENTEIO_URL}
          interaction={
            !canOperateValve(simulation, 'venteio')
              ? null
              : valves.venteio
                ? { label: 'Fechar venteio', action: () => setValveOpen('venteio', false) }
                : { label: 'Abrir venteio', action: () => setValveOpen('venteio', true) }
          }
        />
        <GltfModel url={BOX_URL} visible={false} physicality="fixed" scale={[12, 5, 2]} />
        <ParticleEmitter
          {...ventGasProps}
          velocity={() => getGasVelocity(displayedPressure.current)}
          emitting={() =>
            isGasEmitting(
              simulationRef.current.valves,
              simulationRef.current.activeValve,
              displayedPressure.current,
            )
          }
        />
      </group>
      {stage === 'isolating' || stage === 'isolated' || stage === 'removed' ? (
        <ReplacementGauge
          interaction={
            stage === 'removed' && activeValve === null
              ? { label: 'Coletar manômetro', action: () => applyAction({ type: 'collect-gauge' }) }
              : null
          }
        />
      ) : null}
    </group>
  );
};
