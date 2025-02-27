import { ipcRenderer, remote } from "electron";
import { Middleware } from "@reduxjs/toolkit";
import Path from "path";
import rimraf from "rimraf";
import { promisify } from "util";
import getTmp from "../../../lib/helpers/getTmp";
import { RootState } from "../../configureStore";
import copy from "../../../lib/helpers/fsCopy";
import consoleActions from "../console/consoleActions";
import navigationActions from "../navigation/navigationActions";
import { denormalizeProject } from "../project/projectActions";
import confirmEjectEngineDialog from "../../../lib/electron/dialog/confirmEjectEngineDialog";
import { statSync } from "fs-extra";
import confirmEjectEngineReplaceDialog from "../../../lib/electron/dialog/confirmEjectEngineReplaceDialog";
import ejectEngineToDir from "../../../lib/project/ejectEngineToDir";
import actions from "./buildGameActions";

const rmdir = promisify(rimraf);

const buildUUID = "_gbsbuild";

const buildGameMiddleware: Middleware<{}, RootState> = (store) => (
  next
) => async (action) => {
  if (actions.buildGame.match(action)) {
    const state = store.getState();
    const dispatch = store.dispatch.bind(store);

    const { buildType, exportBuild, ejectBuild } = action.payload;
    const buildStartTime = Date.now();

    if (state.console.status === "running") {
      // Stop build if already building
      return;
    }

    dispatch(consoleActions.startConsole());

    try {
      const projectRoot = state.document && state.document.root;
      const project = denormalizeProject(state.project.present);
      const outputRoot = Path.normalize(`${getTmp()}/${buildUUID}`);
      const engineFields = state.engine.fields;

      await rmdir(outputRoot);

      const buildProject = await import(
        "../../../lib/compiler/buildProject"
      ).then((module) => module.default);

      await buildProject(project, {
        projectRoot,
        buildType,
        outputRoot,
        engineFields,
        tmpPath: getTmp(),
        profile: state.editor.profile,
        progress: (message) => {
          if (
            message !== "'" &&
            message.indexOf("unknown or unsupported #pragma") === -1
          ) {
            dispatch(consoleActions.stdOut(message));
          }
        },
        warnings: (message) => {
          dispatch(consoleActions.stdErr(message));
        },
      });

      if (exportBuild) {
        await copy(
          `${outputRoot}/build/${buildType}`,
          `${projectRoot}/build/${buildType}`
        );
        remote.shell.openItem(`${projectRoot}/build/${buildType}`);
        dispatch(consoleActions.stdOut("-"));
        dispatch(
          consoleActions.stdOut(
            `Success! ${
              buildType === "web"
                ? `Site is ready at ${Path.normalize(
                    `${projectRoot}/build/web/index.html`
                  )}`
                : `ROM is ready at ${Path.normalize(
                    `${projectRoot}/build/rom/game.gb`
                  )}`
            }`
          )
        );
      } else if (ejectBuild) {
        await copy(`${outputRoot}`, `${projectRoot}/build/src`);
        remote.shell.openItem(`${projectRoot}/build/src`);
      }

      if (buildType === "web" && !exportBuild && !ejectBuild) {
        dispatch(consoleActions.stdOut("-"));
        dispatch(consoleActions.stdOut("Success! Starting emulator..."));

        ipcRenderer.send(
          "open-play",
          `file://${outputRoot}/build/web/index.html`
        );
      }

      const buildTime = Date.now() - buildStartTime;

      dispatch(consoleActions.stdOut(`Build Time: ${buildTime}ms`));
      dispatch(consoleActions.completeConsole());
    } catch (e) {
      if (typeof e === "string") {
        dispatch(navigationActions.setSection("build"));
        dispatch(consoleActions.stdErr(e));
      } else {
        dispatch(navigationActions.setSection("build"));
        dispatch(consoleActions.stdErr(e.toString()));
      }
      dispatch(consoleActions.completeConsole());
      throw e;
    }

    if (module.hot) {
      module.hot.accept("../../../lib/compiler/buildProject", () => {
        dispatch(consoleActions.clearConsole());
        dispatch(consoleActions.stdOut("Reloaded GB Studio Compiler"));
      });
    }
  } else if (actions.deleteBuildCache.match(action)) {
    const dispatch = store.dispatch.bind(store);
    const cacheRoot = Path.normalize(`${getTmp()}/_gbscache`);
    await rmdir(cacheRoot);
    dispatch(consoleActions.clearConsole());
    dispatch(consoleActions.stdOut("Cleared GB Studio caches"));
    
  } else if (actions.ejectEngine.match(action)) {

    const cancel = confirmEjectEngineDialog();

    if (cancel) {
      return;
    }

    const state = store.getState();
    const outputDir = Path.join(state.document.root, "assets", "engine");

    let ejectedEngineExists;
    try {
      statSync(outputDir);
      ejectedEngineExists = true;
    } catch (e) {
      ejectedEngineExists = false;
    }

    if (ejectedEngineExists) {
      const cancel2 = confirmEjectEngineReplaceDialog();
      if (cancel2) {
        return;
      }
    }

    ejectEngineToDir(outputDir).then(() => {
      remote.shell.openItem(outputDir);
    });

  }

  return next(action);
};

export default buildGameMiddleware;

if (module.hot) {
  module.hot.accept("../../../lib/compiler/buildProject");
}
