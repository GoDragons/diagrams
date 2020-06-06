import React from "react";
import cx from "classnames";
import { Link } from "react-router-dom";
import { Row, Col, Button, notification, Space, Typography } from "antd";
import {
  DownloadOutlined,
  ShareAltOutlined,
  SubnodeOutlined,
  BorderlessTableOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import Card from "Card/Card";
import html2canvas from "html2canvas";

import "./Toolbar.scss";

export default function Toolbar({
  diagramData,
  isGridSnapActive,
  toggleGridSnap,
  openVersionModal,
  save,
  openShareModal,
  hideGrid,
  showGrid,
}) {
  function displayVersionLabel() {
    if (diagramData.isLatest) {
      return <span className="version latest-version">(latest version)</span>;
    } else {
      return (
        <span className="version old-version">
          (old version - read-only mode)
        </span>
      );
    }
  }

  function createSnapshot() {
    hideGrid();
    setTimeout(() => {
      html2canvas(document.querySelector(".editor")).then((snapshot) => {
        document.body.appendChild(snapshot);
        var dataURL = snapshot.toDataURL("image/jpeg");

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = dataURL;
        // the filename you want
        a.download = "diagram.jpg";
        document.body.appendChild(a);
        a.click();

        notification.open({
          message: "File saved",
        });
        showGrid();
      });
    }, 100);
  }

  if (!diagramData) {
    return null;
  }

  return (
    <Card className="toolbar">
      <Space direction="vertical">
        <div className="item">
          <DownloadOutlined type="primary" onClick={createSnapshot} />
          <Typography.Text>Download</Typography.Text>
        </div>

        <div className="item">
          <ShareAltOutlined
            type="primary"
            onClick={openShareModal}
            className="share"
          />
          <Typography.Text>Share</Typography.Text>
        </div>

        {diagramData.isLatest ? (
          <>
            <div className="item">
              <SubnodeOutlined
                type="primary"
                onClick={openVersionModal}
                className="create-version"
              />
              <Typography.Text>Commit</Typography.Text>
            </div>
            <div className="item">
              <BorderlessTableOutlined
                type="primary"
                onClick={toggleGridSnap}
                className={cx("grid-snap", { on: isGridSnapActive })}
              />
              <Typography.Text>Snap</Typography.Text>
            </div>
            <div className="item">
              <SaveOutlined type="primary" onClick={save} className={"save"} />
              <Typography.Text>Save</Typography.Text>
            </div>
          </>
        ) : null}
      </Space>
    </Card>
  );
}
