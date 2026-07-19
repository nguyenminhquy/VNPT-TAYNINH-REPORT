(function () {
  const data = window.VNPT_REPORT_DATA;

  if (!data) {
    return;
  }

  const reportMeta = {
    mbb: { owner: "Hưng", groupLabel: "Dịch vụ" },
    fbb: { owner: "Bảo", groupLabel: "Dịch vụ" },
    mytv: { owner: "Tân", groupLabel: "Dịch vụ" },
    mll: { owner: "Khánh", groupLabel: "Vận hành" },
    ispeed: { owner: "Quốc", groupLabel: "Vận hành" },
    "5s": { owner: "Tân", groupLabel: "Vận hành" },
    xlsc: { owner: "Tuấn", groupLabel: "Vận hành" },
    appendix: { owner: "Phụ lục", groupLabel: "Bổ sung" },
  };

  const reportUploadConfig = [
    { id: "mbb", menuLabel: "MBB", description: "Chất lượng mạng di động", label: "BÁO CÁO MBB_HUNG", owner: "Hưng", filename: "1. BÁO CÁO MBB_HUNG.xlsx" },
    { id: "fbb", menuLabel: "FBB", description: "Chất lượng băng rộng", label: "BÁO CÁO FBB_BAO", owner: "Bảo", filename: "2. BÁO CÁO FBB_BAO.xlsx" },
    { id: "mytv", menuLabel: "MyTV", description: "Chất lượng truyền hình", label: "BÁO CÁO MYTV_TÂN", owner: "Tân", filename: "3. BÁO CÁO MYTV_TÂN.xlsx" },
    { id: "mll", menuLabel: "MLL", description: "Mất liên lạc toàn mạng", label: "BÁO CÁO MLL_KHANH", owner: "Khánh", filename: "4. BÁO CÁO MLL_KHANH.xlsx" },
    { id: "ispeed", menuLabel: "i-Speed", description: "Đo kiểm tốc độ mạng", label: "BÁO CÁO ISPEED_QUOC", owner: "Quốc", filename: "5. BÁO CÁO ISPEED_QUOC.xlsx" },
    { id: "5s", menuLabel: "5S nhà trạm", description: "Tiến độ hiện trường", label: "BÁO CÁO 5S NHÀ TRẠM_TÂN", owner: "Tân", filename: "6. BÁO CÁO 5S NHÀ TRẠM_TÂN.xlsx" },
    { id: "xlsc", menuLabel: "XLSC", description: "Xử lý sự cố", label: "BÁO CÁO XLSC_TUẤN", owner: "Tuấn", filename: "7.BÁO CÁO XLSC_TUẤN.xlsx" },
    { id: "appendix", menuLabel: "Phụ lục 1", description: "Giải trình sự cố trạm", label: "PHỤ LỤC 1", owner: "Phụ lục", filename: "PHỤ LỤC 1.xlsx" },
  ];

  const dataEntryState = {
    activeTrigger: null,
    toastTimer: null,
    updatedReports: new Set(),
    availableReports: new Set(),
    wordTemplateReady: false,
    exportInProgress: false,
    statusesLoaded: false,
    activeReportId: "mbb",
  };

  const selectors = {
    heroEyebrow: document.getElementById("hero-eyebrow"),
    heroTitle: document.getElementById("hero-title"),
    heroSubtitle: document.getElementById("hero-subtitle"),
    generatedAt: document.getElementById("generated-at"),
    heroPulse: document.getElementById("hero-pulse"),
    heroStats: document.getElementById("hero-stats"),
    quickNav: document.getElementById("quick-nav"),
    signalBands: document.getElementById("signal-bands"),
    reportMenu: document.getElementById("report-menu"),
    reportMenuDetail: document.getElementById("report-menu-detail"),
    reportMenuReadyCount: document.getElementById("report-menu-ready-count"),
    reportUploadToggle: document.getElementById("report-upload-toggle"),
    activeReport: document.getElementById("active-report"),
    activeReportGroup: document.getElementById("active-report-group"),
    activeReportHeading: document.getElementById("active-report-heading"),
    activeReportCaption: document.getElementById("active-report-caption"),
    actionItems: document.getElementById("action-items"),
    sourcesList: document.getElementById("sources-list"),
    heroUploadToggle: document.getElementById("hero-upload-toggle"),
    dataEntryToggle: document.getElementById("data-entry-toggle"),
    dataEntryBackdrop: document.getElementById("data-entry-backdrop"),
    dataEntrySidebar: document.getElementById("data-entry-sidebar"),
    dataEntryClose: document.getElementById("data-entry-close"),
    dataEntryCount: document.getElementById("data-entry-count"),
    dataEntryApiStatus: document.getElementById("data-entry-api-status"),
    dataEntryList: document.getElementById("data-entry-list"),
    dataEntryRefresh: document.getElementById("data-entry-refresh"),
    dataEntryExportWord: document.getElementById("data-entry-export-word"),
    dataEntryFooterNote: document.getElementById("data-entry-footer-note"),
    dataEntryToast: document.getElementById("data-entry-toast"),
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function withLineBreaks(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function padCount(value) {
    return String(value ?? 0).padStart(2, "0");
  }

  function formatGeneratedAt(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderListItems(items) {
    return items
      .map(function (item) {
        return "<li>" + withLineBreaks(item) + "</li>";
      })
      .join("");
  }

  function buildHeroPulseItems() {
    return [
      {
        label: "Khối dịch vụ",
        value: padCount((data.serviceReports || []).length),
        note: "Nhóm MBB, FBB, MyTV",
      },
      {
        label: "Khối vận hành",
        value: padCount((data.operationReports || []).length),
        note: "MLL, i-Speed, 5S, XLSC",
      },
      {
        label: "Việc ưu tiên",
        value: padCount((data.actionItems || []).length),
        note: "Danh sách hành động tuần",
      },
      {
        label: "Nguồn Excel",
        value: padCount((data.sources || []).length),
        note: "Đầu vào đồng bộ dữ liệu",
      },
    ];
  }

  function buildQuickNavItems() {
    return [
      {
        href: "#overview",
        label: "Tín hiệu chính",
        meta: (data.signalBands || []).length + " chỉ số",
      },
      {
        href: "#services",
        label: "Khối dịch vụ",
        meta: (data.serviceReports || []).length + " báo cáo",
      },
      {
        href: "#operations",
        label: "Khối vận hành",
        meta: (data.operationReports || []).length + " báo cáo",
      },
      {
        href: "#actions",
        label: "Hành động",
        meta: (data.actionItems || []).length + " việc ưu tiên",
      },
    ];
  }

  function renderHeroPulseItem(item) {
    return (
      '<article class="hero-pulse__item">' +
      '<span class="hero-pulse__label">' +
      escapeHtml(item.label) +
      "</span>" +
      '<strong class="hero-pulse__value">' +
      escapeHtml(item.value) +
      "</strong>" +
      '<span class="hero-pulse__note">' +
      escapeHtml(item.note) +
      "</span>" +
      "</article>"
    );
  }

  function renderQuickNavItem(item) {
    return (
      '<a class="quick-nav__link" href="' +
      escapeHtml(item.href) +
      '">' +
      '<span class="quick-nav__label">' +
      escapeHtml(item.label) +
      "</span>" +
      '<span class="quick-nav__meta">' +
      escapeHtml(item.meta) +
      "</span>" +
      "</a>"
    );
  }

  function renderStatCard(item) {
    return (
      '<article class="stat-card tone-' +
      escapeHtml(item.tone) +
      '">' +
      '<span class="stat-card__label">' +
      escapeHtml(item.label) +
      "</span>" +
      '<strong class="stat-card__value">' +
      escapeHtml(item.value) +
      "</strong>" +
      "</article>"
    );
  }

  function renderSignalCard(item) {
    return (
      '<article class="signal-card tone-' +
      escapeHtml(item.tone) +
      '">' +
      '<p class="signal-card__label">' +
      escapeHtml(item.label) +
      "</p>" +
      '<strong class="signal-card__value">' +
      escapeHtml(item.value) +
      "</strong>" +
      '<p class="signal-card__note">' +
      escapeHtml(item.note) +
      "</p>" +
      "</article>"
    );
  }

  function renderMetrics(metrics) {
    return metrics
      .map(function (item) {
        return (
          '<article class="report-metric tone-' +
          escapeHtml(item.tone) +
          '">' +
          '<span class="report-metric__label">' +
          escapeHtml(item.label) +
          "</span>" +
          '<strong class="report-metric__value">' +
          escapeHtml(item.value) +
          "</strong>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderChart(chart) {
    if (!chart || !Array.isArray(chart.items) || chart.items.length === 0) {
      return "";
    }

    const maxValue = Math.max.apply(
      null,
      chart.items.map(function (item) {
        return Number(item.value) || 0;
      })
    );

    const rows = chart.items
      .map(function (item) {
        const width = maxValue > 0 ? Math.max((Number(item.value) / maxValue) * 100, 6) : 0;
        return (
          '<div class="chart-row tone-' +
          escapeHtml(item.tone || "info") +
          '">' +
          '<div class="chart-row__head">' +
          "<div>" +
          "<strong>" +
          escapeHtml(item.label) +
          "</strong>" +
          "</div>" +
          "<b>" +
          escapeHtml(item.display || item.value) +
          "</b>" +
          "</div>" +
          '<div class="chart-row__track">' +
          '<span class="chart-row__fill" style="width:' +
          width.toFixed(2) +
          '%"></span>' +
          "</div>" +
          '<span class="chart-row__note">' +
          escapeHtml(item.note || "") +
          "</span>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<section class="panel-block">' +
      '<h3 class="panel-block__title">' +
      escapeHtml(chart.title) +
      "</h3>" +
      '<div class="chart">' +
      rows +
      "</div>" +
      "</section>"
    );
  }

  function renderTable(table) {
    if (!table || !Array.isArray(table.rows) || table.rows.length === 0) {
      return "";
    }

    const header = table.columns
      .map(function (column) {
        return "<th>" + escapeHtml(column) + "</th>";
      })
      .join("");

    const body = table.rows
      .map(function (row) {
        const cells = table.columns
          .map(function (column) {
            return "<td>" + withLineBreaks(row[column] ?? "") + "</td>";
          })
          .join("");
        return "<tr>" + cells + "</tr>";
      })
      .join("");

    return (
      '<section class="panel-block">' +
      '<h3 class="panel-block__title">' +
      escapeHtml(table.title) +
      "</h3>" +
      '<div class="table-shell">' +
      "<table>" +
      "<thead><tr>" +
      header +
      "</tr></thead>" +
      "<tbody>" +
      body +
      "</tbody>" +
      "</table>" +
      "</div>" +
      "</section>"
    );
  }

  function renderChecklist(block) {
    if (!block || !Array.isArray(block.items) || block.items.length === 0) {
      return "";
    }

    return (
      '<section class="panel-block">' +
      '<h3 class="panel-block__title">' +
      escapeHtml(block.title) +
      "</h3>" +
      '<ul class="list-block">' +
      renderListItems(block.items) +
      "</ul>" +
      "</section>"
    );
  }

  function renderInsights(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    return (
      '<section class="panel-block">' +
      '<h3 class="panel-block__title">Nhận định nhanh</h3>' +
      '<ul class="insight-list">' +
      renderListItems(items) +
      "</ul>" +
      "</section>"
    );
  }

  function renderReport(report) {
    const meta = reportMeta[report.id] || {};
    const ownerLabel = meta.owner ? "Phụ trách " + meta.owner : "Tự động tổng hợp";
    const groupLabel = meta.groupLabel || report.group || "Báo cáo";

    return (
      '<article id="report-' +
      escapeHtml(report.id) +
      '" class="report-card tone-' +
      escapeHtml(report.tone) +
      '">' +
      '<div class="report-card__topline">' +
      '<div class="report-card__chips">' +
      '<span class="report-chip">' +
      escapeHtml(groupLabel) +
      "</span>" +
      '<span class="report-chip report-chip--soft">' +
      escapeHtml(ownerLabel) +
      "</span>" +
      "</div>" +
      '<span class="report-card__anchor">#' +
      escapeHtml(String(report.id).toUpperCase()) +
      "</span>" +
      "</div>" +
      '<div class="report-card__header">' +
      "<div>" +
      '<p class="report-card__kicker">' +
      escapeHtml(report.kicker) +
      "</p>" +
      '<h3 class="report-card__title">' +
      escapeHtml(report.title) +
      "</h3>" +
      '<p class="report-card__summary">' +
      withLineBreaks(report.summary) +
      "</p>" +
      "</div>" +
      '<div class="report-card__metrics">' +
      renderMetrics(report.metrics || []) +
      "</div>" +
      "</div>" +
      '<div class="report-card__body">' +
      '<div class="report-card__content">' +
      renderInsights(report.insights || []) +
      renderChecklist(report.list) +
      "</div>" +
      '<div class="report-card__visuals">' +
      renderChart(report.chart) +
      renderTable(report.table) +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderActionCard(item, index) {
    return (
      '<article class="action-card tone-' +
      escapeHtml(item.tone) +
      '">' +
      '<span class="action-card__index">' +
      escapeHtml(String(index + 1).padStart(2, "0")) +
      "</span>" +
      '<h3 class="action-card__title">' +
      escapeHtml(item.title) +
      "</h3>" +
      '<p class="action-card__detail">' +
      withLineBreaks(item.detail) +
      "</p>" +
      "</article>"
    );
  }

  function renderSourceCard(item) {
    return (
      '<article class="source-card tone-info">' +
      '<span class="source-card__tag">' +
      escapeHtml(item.tag) +
      "</span>" +
      '<p class="source-card__name">' +
      escapeHtml(item.name) +
      "</p>" +
      "</article>"
    );
  }

  function formatFileSize(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) {
      return value + " B";
    }
    if (value < 1024 * 1024) {
      return (value / 1024).toFixed(1) + " KB";
    }
    return (value / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatUploadDate(value) {
    if (!value) {
      return "Chưa có dữ liệu";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderUploadItem(config, index, current) {
    const detail = current && current.exists
      ? formatFileSize(current.size) + " · " + formatUploadDate(current.updatedAt)
      : "Chưa tìm thấy tệp nguồn";

    return (
      '<article class="data-entry-item" data-report-id="' +
      escapeHtml(config.id) +
      '">' +
      '<div class="data-entry-item__number">' +
      String(index + 1).padStart(2, "0") +
      "</div>" +
      '<div class="data-entry-item__content">' +
      '<div class="data-entry-item__head">' +
      "<div>" +
      '<p class="data-entry-item__owner">Phụ trách ' +
      escapeHtml(config.owner) +
      "</p>" +
      '<h3 class="data-entry-item__title">' +
      escapeHtml(config.label) +
      "</h3>" +
      "</div>" +
      '<span class="data-entry-item__state" data-upload-state>Đang dùng</span>' +
      "</div>" +
      '<p class="data-entry-item__meta" data-upload-meta>' +
      escapeHtml(detail) +
      "</p>" +
      '<div class="data-entry-item__action">' +
      '<input class="data-entry-input" id="upload-' +
      escapeHtml(config.id) +
      '" data-report-id="' +
      escapeHtml(config.id) +
      '" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />' +
      '<label class="data-entry-picker" for="upload-' +
      escapeHtml(config.id) +
      '"><span data-picker-label>Chọn tệp Excel</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-6-6 6 6 6-6" /></svg></label>' +
      "</div>" +
      '<div class="data-entry-item__progress" aria-hidden="true"><span></span></div>' +
      '<p class="data-entry-item__message" data-upload-message>Lưu thành ' +
      escapeHtml(config.filename) +
      "</p>" +
      "</div>" +
      "</article>"
    );
  }

  function renderDataEntryList(statuses) {
    const statusMap = new Map(
      (statuses || []).map(function (item) {
        return [item.id, item];
      })
    );

    selectors.dataEntryList.innerHTML = reportUploadConfig
      .map(function (config, index) {
        return renderUploadItem(config, index, statusMap.get(config.id));
      })
      .join("");
  }

  function getAllReports() {
    return (data.serviceReports || []).concat(data.operationReports || []);
  }

  function getReportById(reportId) {
    return getAllReports().find(function (report) {
      return report.id === reportId;
    });
  }

  function renderReportMenuItem(config, index) {
    const report = getReportById(config.id);
    const isActive = dataEntryState.activeReportId === config.id;
    const isReady = dataEntryState.availableReports.has(config.id);
    const statusLabel = dataEntryState.statusesLoaded ? (isReady ? "Sẵn sàng" : "Thiếu tệp") : "Đang kiểm tra";

    return (
      '<button class="report-menu__item tone-' +
      escapeHtml((report && report.tone) || "info") +
      (isActive ? " is-active" : "") +
      '" type="button" data-report-menu-id="' +
      escapeHtml(config.id) +
      '"' +
      (isActive ? ' aria-current="page"' : "") +
      ">" +
      '<span class="report-menu__number">' +
      String(index + 1).padStart(2, "0") +
      "</span>" +
      '<span class="report-menu__copy"><strong>' +
      escapeHtml(config.menuLabel) +
      "</strong><small>" +
      escapeHtml(config.description) +
      "</small></span>" +
      '<span class="report-menu__state' +
      (dataEntryState.statusesLoaded ? (isReady ? " is-ready" : " is-missing") : "") +
      '" title="' +
      escapeHtml(statusLabel) +
      '"></span>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>' +
      "</button>"
    );
  }

  function renderReportMenuDetail(reportId) {
    const config = reportUploadConfig.find(function (item) {
      return item.id === reportId;
    });
    const report = getReportById(reportId);

    if (!config || !report || !selectors.reportMenuDetail) {
      return;
    }

    const isReady = dataEntryState.availableReports.has(reportId);
    const statusText = dataEntryState.statusesLoaded ? (isReady ? "Nguồn Excel sẵn sàng" : "Chưa có tệp nguồn") : "Đang kiểm tra nguồn dữ liệu";

    selectors.reportMenuDetail.innerHTML =
      '<div class="report-menu-detail__top"><span>Đang xem</span><b class="tone-' +
      escapeHtml(report.tone || "info") +
      '">' +
      escapeHtml(reportMeta[reportId]?.groupLabel || "Báo cáo") +
      "</b></div>" +
      "<strong>" +
      escapeHtml(config.label) +
      "</strong>" +
      '<p>Phụ trách: <b>' +
      escapeHtml(config.owner) +
      "</b></p>" +
      '<span class="report-menu-detail__status' +
      (isReady ? " is-ready" : "") +
      '"><i></i>' +
      escapeHtml(statusText) +
      "</span>";
  }

  function renderReportMenu() {
    if (!selectors.reportMenu) {
      return;
    }

    selectors.reportMenu.innerHTML = reportUploadConfig.map(renderReportMenuItem).join("");
    selectors.reportMenuReadyCount.textContent = dataEntryState.availableReports.size + "/" + reportUploadConfig.length;
    renderReportMenuDetail(dataEntryState.activeReportId);
  }

  function animateActiveReport() {
    if (!selectors.activeReport) {
      return;
    }

    const card = selectors.activeReport.querySelector(".report-card");
    if (card) {
      card.classList.add("animate-on-scroll");
      requestAnimationFrame(function () {
        card.classList.add("is-visible");
      });
    }

    selectors.activeReport.querySelectorAll(".chart-row__fill").forEach(function (bar, index) {
      const targetWidth = bar.style.width;
      bar.style.width = "0%";
      bar.style.transition = "width 0.75s cubic-bezier(0.22, 1, 0.36, 1) " + index * 0.06 + "s";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bar.style.width = targetWidth;
        });
      });
    });
  }

  function selectReport(reportId, shouldScroll) {
    const report = getReportById(reportId);
    if (!report || !selectors.activeReport) {
      return;
    }

    dataEntryState.activeReportId = reportId;
    selectors.activeReportGroup.textContent = (reportMeta[reportId]?.groupLabel || "Báo cáo") + " · " + report.kicker;
    selectors.activeReportHeading.textContent = report.title;
    selectors.activeReportCaption.textContent = report.summary;
    selectors.activeReport.innerHTML = renderReport(report);
    renderReportMenu();
    animateActiveReport();

    if (shouldScroll) {
      document.getElementById("reports").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function initializeReportWorkspace() {
    if (!selectors.reportMenu || !selectors.activeReport) {
      return;
    }

    renderReportMenu();
    selectReport(dataEntryState.activeReportId, false);
    selectors.reportMenu.addEventListener("click", function (event) {
      const item = event.target.closest("[data-report-menu-id]");
      if (!item) {
        return;
      }
      selectReport(item.dataset.reportMenuId, true);
    });
  }

  function setDataEntryOpen(isOpen) {
    selectors.dataEntrySidebar.classList.toggle("is-open", isOpen);
    selectors.dataEntryBackdrop.classList.toggle("is-open", isOpen);
    selectors.dataEntrySidebar.setAttribute("aria-hidden", String(!isOpen));
    selectors.dataEntryToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("data-entry-open", isOpen);

    if (isOpen) {
      dataEntryState.activeTrigger = document.activeElement;
      selectors.dataEntryClose.focus();
    } else if (dataEntryState.activeTrigger && typeof dataEntryState.activeTrigger.focus === "function") {
      dataEntryState.activeTrigger.focus();
    }
  }

  function showDataEntryToast(message, tone) {
    window.clearTimeout(dataEntryState.toastTimer);
    selectors.dataEntryToast.textContent = message;
    selectors.dataEntryToast.className = "data-entry-toast is-visible tone-" + (tone || "positive");
    dataEntryState.toastTimer = window.setTimeout(function () {
      selectors.dataEntryToast.classList.remove("is-visible");
    }, 4200);
  }

  function updateDataEntrySummary() {
    const updatedCount = dataEntryState.updatedReports.size;
    selectors.dataEntryCount.textContent = updatedCount + "/" + reportUploadConfig.length;
    selectors.dataEntryRefresh.disabled = updatedCount === 0;
    selectors.dataEntryExportWord.disabled =
      !dataEntryState.wordTemplateReady ||
      dataEntryState.availableReports.size !== reportUploadConfig.length ||
      dataEntryState.exportInProgress;
  }

  function setUploadItemState(reportId, state, message, meta) {
    const item = selectors.dataEntryList.querySelector('[data-report-id="' + reportId + '"]');
    if (!item) {
      return;
    }

    const input = item.querySelector(".data-entry-input");
    const stateLabel = item.querySelector("[data-upload-state]");
    const messageLabel = item.querySelector("[data-upload-message]");
    const metaLabel = item.querySelector("[data-upload-meta]");
    const pickerLabel = item.querySelector("[data-picker-label]");

    item.classList.remove("is-uploading", "is-success", "is-error");
    item.classList.add("is-" + state);
    input.disabled = state === "uploading";
    stateLabel.textContent = state === "uploading" ? "Đang xử lý" : state === "success" ? "Đã cập nhật" : "Cần kiểm tra";
    messageLabel.textContent = message;
    pickerLabel.textContent = state === "uploading" ? "Đang tổng hợp..." : "Chọn tệp khác";

    if (meta) {
      metaLabel.textContent = meta;
    }
  }

  async function loadReportStatuses() {
    renderDataEntryList([]);

    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Máy chủ nhập dữ liệu chưa sẵn sàng.");
      }
      const payload = await response.json();
      renderDataEntryList(payload.reports || []);
      dataEntryState.availableReports = new Set(
        (payload.reports || [])
          .filter(function (report) {
            return report.exists;
          })
          .map(function (report) {
            return report.id;
          })
      );
      dataEntryState.wordTemplateReady = Boolean(payload.wordTemplateReady);
      dataEntryState.statusesLoaded = true;
      updateDataEntrySummary();
      renderReportMenu();
      selectors.dataEntryApiStatus.textContent = "Sẵn sàng";
      selectors.dataEntryApiStatus.classList.add("is-ready");
    } catch (error) {
      dataEntryState.statusesLoaded = true;
      renderReportMenu();
      selectors.dataEntryApiStatus.textContent = "Chỉ xem";
      selectors.dataEntryApiStatus.classList.add("is-offline");
      selectors.dataEntryFooterNote.textContent = "Hãy chạy python backend/server.py để bật chức năng cập nhật Excel.";
      selectors.dataEntryList.querySelectorAll(".data-entry-input").forEach(function (input) {
        input.disabled = true;
      });
    }
  }

  async function uploadReport(reportId, file) {
    const config = reportUploadConfig.find(function (item) {
      return item.id === reportId;
    });

    if (!config || !file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setUploadItemState(reportId, "error", "Chỉ chấp nhận tệp Excel .xlsx.");
      showDataEntryToast("Tệp đã chọn không phải định dạng .xlsx.", "critical");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadItemState(reportId, "error", "Tệp vượt quá giới hạn 25 MB.");
      showDataEntryToast("Tệp vượt quá giới hạn 25 MB.", "critical");
      return;
    }

    setUploadItemState(
      reportId,
      "uploading",
      "Đang kiểm tra cấu trúc và tạo lại dashboard...",
      file.name + " · " + formatFileSize(file.size)
    );

    try {
      const response = await fetch("/api/reports/" + encodeURIComponent(reportId), {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "X-File-Name": encodeURIComponent(file.name),
        },
        body: file,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Không thể cập nhật báo cáo.");
      }

      const report = payload.report || {};
      dataEntryState.updatedReports.add(reportId);
      dataEntryState.availableReports.add(reportId);
      renderReportMenu();
      setUploadItemState(
        reportId,
        "success",
        "Đã tổng hợp xong. Bấm Làm mới dashboard để xem số liệu mới.",
        formatFileSize(report.size) + " · " + formatUploadDate(report.updatedAt)
      );
      updateDataEntrySummary();
      showDataEntryToast(config.label + " đã được cập nhật.", "positive");
    } catch (error) {
      setUploadItemState(reportId, "error", error.message || "Không thể cập nhật báo cáo.");
      showDataEntryToast("Cập nhật thất bại. Dữ liệu cũ vẫn được giữ nguyên.", "critical");
    }
  }

  function exportFilenameFromHeader(header) {
    const utf8Match = String(header || "").match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
      return decodeURIComponent(utf8Match[1]);
    }
    return "TTHT Báo cáo công việc - cập nhật.docx";
  }

  async function exportWordReport() {
    if (dataEntryState.exportInProgress || selectors.dataEntryExportWord.disabled) {
      return;
    }

    dataEntryState.exportInProgress = true;
    selectors.dataEntryExportWord.classList.add("is-processing");
    selectors.dataEntryExportWord.querySelector("span").textContent = "Đang tạo file Word...";
    updateDataEntrySummary();
    selectors.dataEntryFooterNote.textContent = "Đang cập nhật các bảng và số tổng hợp vào mẫu Word...";

    try {
      const response = await fetch("/api/export-word", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(function () {
          return {};
        });
        throw new Error(payload.error || "Không thể tạo báo cáo Word.");
      }

      const blob = await response.blob();
      const filename = exportFilenameFromHeader(response.headers.get("Content-Disposition"));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
      selectors.dataEntryFooterNote.textContent = "Đã tạo Word từ đúng các vùng dữ liệu đang dùng trong mẫu.";
      showDataEntryToast("Báo cáo Word đã được tạo và tải xuống.", "positive");
    } catch (error) {
      selectors.dataEntryFooterNote.textContent = "Không thể tạo Word. Các tệp Excel hiện tại không bị thay đổi.";
      showDataEntryToast(error.message || "Không thể tạo báo cáo Word.", "critical");
    } finally {
      dataEntryState.exportInProgress = false;
      selectors.dataEntryExportWord.classList.remove("is-processing");
      selectors.dataEntryExportWord.querySelector("span").textContent = "Xuất báo cáo Word";
      updateDataEntrySummary();
    }
  }

  function initializeDataEntry() {
    if (!selectors.dataEntrySidebar || !selectors.dataEntryList) {
      return;
    }

    updateDataEntrySummary();
    loadReportStatuses();

    selectors.dataEntryToggle.addEventListener("click", function () {
      setDataEntryOpen(true);
    });
    selectors.reportUploadToggle.addEventListener("click", function () {
      setDataEntryOpen(true);
    });
    selectors.heroUploadToggle.addEventListener("click", function () {
      setDataEntryOpen(true);
    });
    selectors.dataEntryClose.addEventListener("click", function () {
      setDataEntryOpen(false);
    });
    selectors.dataEntryBackdrop.addEventListener("click", function () {
      setDataEntryOpen(false);
    });
    selectors.dataEntryRefresh.addEventListener("click", function () {
      window.location.reload();
    });
    selectors.dataEntryExportWord.addEventListener("click", exportWordReport);
    selectors.dataEntryList.addEventListener("change", function (event) {
      const input = event.target.closest(".data-entry-input");
      if (!input || !input.files || !input.files[0]) {
        return;
      }
      uploadReport(input.dataset.reportId, input.files[0]);
      input.value = "";
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && selectors.dataEntrySidebar.classList.contains("is-open")) {
        setDataEntryOpen(false);
      }
    });
  }

  function parseCounterText(text) {
    const value = String(text ?? "").trim();

    if (!value) {
      return null;
    }

    if (/^\d+(?:\.\d+)?%$/.test(value)) {
      const decimals = (value.split(".")[1] || "").replace("%", "").length;
      return {
        target: Number(value.replace("%", "")),
        format: function (number) {
          return number.toFixed(decimals) + "%";
        },
      };
    }

    if (/^\d+$/.test(value)) {
      return {
        target: Number(value),
        format: function (number) {
          return String(Math.round(number));
        },
      };
    }

    if (/^\d{1,3}(?:\.\d{3})+$/.test(value)) {
      return {
        target: Number(value.replace(/\./g, "")),
        format: function (number) {
          return String(Math.round(number)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        },
      };
    }

    if (/^\d+\.\d+$/.test(value)) {
      const decimals = value.split(".")[1].length;
      return {
        target: Number(value),
        format: function (number) {
          return number.toFixed(decimals);
        },
      };
    }

    return null;
  }

  initializeReportWorkspace();
  initializeDataEntry();

  selectors.heroEyebrow.textContent = data.hero.eyebrow;
  selectors.heroTitle.textContent = data.hero.title;
  selectors.heroSubtitle.textContent = data.hero.subtitle;
  selectors.generatedAt.textContent = "Cập nhật " + formatGeneratedAt(data.generatedAt);

  selectors.heroPulse.innerHTML = buildHeroPulseItems().map(renderHeroPulseItem).join("");
  selectors.heroStats.innerHTML = (data.hero.stats || []).map(renderStatCard).join("");
  selectors.quickNav.innerHTML = buildQuickNavItems().map(renderQuickNavItem).join("");
  selectors.signalBands.innerHTML = (data.signalBands || []).map(renderSignalCard).join("");
  selectors.actionItems.innerHTML = (data.actionItems || []).map(renderActionCard).join("");
  selectors.sourcesList.innerHTML = (data.sources || []).map(renderSourceCard).join("");

  var observerOptions = { threshold: 0.12, rootMargin: "0px 0px -48px 0px" };
  var scrollObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        scrollObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document
    .querySelectorAll(
      ".hero-pulse__item, .signal-card, .report-card, .action-card, .source-card, .section__head, .stat-card, .hero__footer"
    )
    .forEach(function (element, index) {
      element.classList.add("animate-on-scroll");
      element.style.transitionDelay = (index % 6) * 0.05 + "s";
      scrollObserver.observe(element);
    });

  document.querySelectorAll(".chart-row__fill").forEach(function (bar, index) {
    var targetWidth = bar.style.width;
    bar.style.width = "0%";
    bar.style.transition =
      "width 0.75s cubic-bezier(0.22, 1, 0.36, 1) " + index * 0.08 + "s";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bar.style.width = targetWidth;
      });
    });
  });

  document
    .querySelectorAll(".stat-card__value, .signal-card__value, .hero-pulse__value")
    .forEach(function (element) {
      var counter = parseCounterText(element.textContent);

      if (!counter || counter.target <= 0) {
        return;
      }

      var startTime = null;
      var duration = 1100;
      element.textContent = counter.format(0);

      function animateCounter(currentTime) {
        if (!startTime) {
          startTime = currentTime;
        }

        var progress = Math.min((currentTime - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var currentValue = counter.target * eased;
        element.textContent = counter.format(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animateCounter);
        }
      }

      var valueObserver = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) {
            requestAnimationFrame(animateCounter);
            valueObserver.unobserve(element);
          }
        },
        { threshold: 0.45 }
      );

      valueObserver.observe(element);
    });
})();
