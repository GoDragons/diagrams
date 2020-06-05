import React from "react";
import cx from "classnames";
import { Link } from "react-router-dom";
import { Row, Col, Button, notification, Space, Card } from "antd";
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
      <Row>
        <Col span={12}>
          <h3 className="diagram-name">
            {diagramData.diagramName}
            {displayVersionLabel()}
          </h3>
        </Col>
        <Col span={12} className="actions">
          <Space>
            <Button type="primary" onClick={createSnapshot}>
              Snapshot
            </Button>
            <Link to="/">
              <Button type="primary" className="home">
                Home
              </Button>
            </Link>
            <Button type="primary" onClick={openShareModal} className="share">
              Share
            </Button>

            {diagramData.isLatest ? (
              <Button
                type="primary"
                onClick={openVersionModal}
                className="create-version"
              >
                Commit
              </Button>
            ) : null}
            {diagramData.isLatest ? (
              <Button
                type="primary"
                onClick={toggleGridSnap}
                className={cx("grid-snap", { on: isGridSnapActive })}
              >
                Grid Snap: {isGridSnapActive ? "on" : "off"}
              </Button>
            ) : null}
            {diagramData.isLatest ? (
              <Button type="primary" onClick={save} className={cx("save")}>
                Save
              </Button>
            ) : null}
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
