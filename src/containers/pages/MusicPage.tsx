import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { ThemeContext } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import { readFile } from "fs-extra";
import useResizable from "../../components/ui/hooks/use-resizable";
import useWindowSize from "../../components/ui/hooks/use-window-size";
import {
  SplitPaneHorizontalDivider,
  SplitPaneVerticalDivider
} from "../../components/ui/splitpane/SplitPaneDivider";
import { RootState } from "../../store/configureStore";
import editorActions from "../../store/features/editor/editorActions";
import settingsActions from "../../store/features/settings/settingsActions";
import { NavigatorSongs } from "../../components/music/NavigatorSongs";
import { SongTracker } from "../../components/music/SongTracker";
import { SequenceEditor } from "../../components/music/SequenceEditor";
import {
  musicSelectors,
} from "../../store/features/entities/entitiesState";
import { assetFilename } from "../../lib/helpers/gbstudio";
import { SongEditor } from "../../components/music/SongEditor";
import SongEditorToolsPanel from "../../components/music/SongEditorToolsPanel";
import { SplitPaneHeader } from "../../components/ui/splitpane/SplitPaneHeader";
import l10n from "../../lib/helpers/l10n";
import { loadUGESong } from "../../lib/helpers/uge/ugeHelper";
import { UgePlayer } from "../../components/music/UgePlayer";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

let playbackState = [-1,-1];
const setPlaybackState = (s:number[]) => {
  playbackState = s;
}

const MusicPage = () => {
  const dispatch = useDispatch();
  const themeContext = useContext(ThemeContext);
  const worldSidebarWidth = useSelector(
    (state: RootState) => state.editor.worldSidebarWidth
  );
  const navigatorSidebarWidth = useSelector(
    (state: RootState) => state.editor.navigatorSidebarWidth
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;

  const allSongs = useSelector((state: RootState) =>
    musicSelectors.selectAll(state)
  );
  const songsLookup = useSelector((state: RootState) =>
    musicSelectors.selectEntities(state)
  );
  const navigationId = useSelector(
    (state: RootState) => state.editor.selectedSongId
  );
  const selectedSong = songsLookup[navigationId] || allSongs[0];
  const selectedId = selectedSong.id;

  const sequenceId = useSelector(
    (state: RootState) => state.editor.selectedSequence
  );

  const projectRoot = useSelector((state: RootState) => state.document.root);

  const [playbackState2, setPlaybackState2] = useState([-1, -1]);
  useEffect(() => {
    setInterval(() => {
      setPlaybackState2(playbackState);
    }, 1000);  
  }, [])

  const [songData, setSongData] = useState<any>(null);
  useEffect(() => {
    const readSong = async () => {
      const path: string = `${assetFilename(
        projectRoot,
        "music",
        selectedSong
      )}`
      const data = await readFile(path);
      const song = loadUGESong(new Uint8Array(data).buffer);
      setSongData(song);
    };
    readSong();
  }, [projectRoot, selectedSong]);

  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: navigatorSidebarWidth,
    direction: "right",
    minSize: 50,
    maxSize: Math.max(101, windowWidth - minCenterPaneWidth - 200),
    onResize: () => {
      recalculateRightColumn();
    },
    onResizeComplete: (v) => {
      if (v < 100) {
        hideNavigator();
      }
      if (v < 200) {
        setLeftPaneSize(200);
      }
      recalculateRightColumn();
    },
  });
  const [centerPaneHeight,, onResizeCenter] = useResizable({
    initialSize: 231,
    direction: "top",
    minSize: 30,
    maxSize: windowHeight - 100,
  });
  const [rightPaneWidth, setRightPaneSize, onResizeRight] = useResizable({
    initialSize: worldSidebarWidth,
    direction: "left",
    minSize: 280,
    maxSize: Math.max(281, windowWidth - minCenterPaneWidth - 100),
    onResize: () => {
      recalculateLeftColumn();
    },
    onResizeComplete: (width) => {
      if (width > windowWidth - 200) {
        setLeftPaneSize(200);
        setRightPaneSize(windowWidth - 200);
      } else {
        recalculateLeftColumn();
      }
    },
  });
  const [] = useResizable({
    initialSize: 231,
    direction: "top",
    minSize: 30,
    maxSize: windowHeight - 100,
  });
  const [] = useState(true);

  useEffect(() => {
    prevWindowWidthRef.current = windowWidth;
  });
  const prevWidth = prevWindowWidthRef.current;

  useEffect(() => {
    if (windowWidth !== prevWidth) {
      const panelsTotalWidth =
        leftPaneWidth + rightPaneWidth + minCenterPaneWidth;
      const widthOverflow = panelsTotalWidth - windowWidth;
      if (widthOverflow > 0) {
        setLeftPaneSize(leftPaneWidth - 0.5 * widthOverflow);
        setRightPaneSize(rightPaneWidth - 0.5 * widthOverflow);
      }
    }
  }, [
    windowWidth,
    prevWidth,
    leftPaneWidth,
    setLeftPaneSize,
    rightPaneWidth,
    setRightPaneSize,
  ]);

  const debouncedStoreWidths = useRef(
    debounce((leftPaneWidth: number, rightPaneWidth: number) => {
      dispatch(editorActions.resizeWorldSidebar(rightPaneWidth));
      dispatch(editorActions.resizeNavigatorSidebar(leftPaneWidth));
    }, 100)
  );

  useEffect(() => debouncedStoreWidths.current(leftPaneWidth, rightPaneWidth), [
    leftPaneWidth,
    rightPaneWidth,
  ]);

  const recalculateLeftColumn = () => {
    const newWidth = Math.min(
      leftPaneWidth,
      windowWidth - rightPaneWidth - minCenterPaneWidth
    );
    if (newWidth !== leftPaneWidth) {
      setLeftPaneSize(newWidth);
    }
  };

  const recalculateRightColumn = () => {
    const newWidth = Math.min(
      rightPaneWidth,
      windowWidth - leftPaneWidth - minCenterPaneWidth
    );
    if (newWidth !== rightPaneWidth) {
      setRightPaneSize(newWidth);
    }
  };

  const hideNavigator = () => {
    dispatch(settingsActions.setShowNavigator(false));
  };

  return (
    <Wrapper>
      <div
        style={{
          transition: "opacity 0.3s ease-in-out",
          width: leftPaneWidth,
          background: themeContext.colors.sidebar.background,
          opacity: leftPaneWidth < 100 ? 0.1 : 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            minWidth: 200,
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          <NavigatorSongs
            height={windowHeight - 38}
            defaultFirst
            instruments={songData ? songData.duty_instruments : []}
            noise={songData ? songData.noise_instruments : []}
            waves={songData ? songData.wave_instruments : []}
          />
        </div>
      </div>
      <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
      <div
        style={{
          flex: "1 1 0",
          minWidth: 0,
          overflow: "hidden",
          background: themeContext.colors.document.background,
          color: themeContext.colors.text,
          height: windowHeight - 38,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ position: "relative", height: "60px" }}>
          <SongEditorToolsPanel
            selectedSongId={selectedId}
          />
        </div>
        <SplitPaneVerticalDivider />
        <div style={{ position: "relative" }}>
          <SplitPaneHeader
            onToggle={() => {}}
            collapsed={false}
          >
            {l10n("FIELD_SEQUENCES")}
          </SplitPaneHeader>
          <SequenceEditor 
            id={selectedId} 
            data={songData?.sequence} 
          />
        </div>
        <SplitPaneVerticalDivider onMouseDown={onResizeCenter} />
        <div style={{ position: "relative", overflow: "auto", flexGrow: 1,height: centerPaneHeight }}>
          {/* <SongTracker 
            id={selectedId} 
            sequenceId={sequenceId}
            data={songData} 
            playbackState={playbackState2}
          /> */}
        </div>
      </div>
      <SplitPaneHorizontalDivider onMouseDown={onResizeRight} />
      <div
        style={{
          width: rightPaneWidth,
          background: themeContext.colors.sidebar.background,
          height: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* <SongEditor id={selectedId} data={songData} /> */}
      </div>
      <UgePlayer 
        song={selectedId} 
        data={songData}
        // onPlaybackUpdate={setPlaybackState} 
      />
    </Wrapper>
  );
};

export default MusicPage;