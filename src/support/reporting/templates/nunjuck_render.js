const nunjucks = require("nunjucks");
const dayjs = require("dayjs");
const humanizeDuration = require("humanize-duration");

class NunjuckRender {
  render(report) {
    const env = nunjucks.configure(__dirname, { autoescape: true });

    env.addFilter("time", function (date) {
      return date.format("h:m:s A");
    });

    env.addFilter("datetime", function (date) {
      return date.format("D.M.YYYY h:m:s A");
    });

    env.addFilter("fulldatetime", function (date) {
      return date.format("MMM DD, YYYY hh:mm:ss A");
    });

    env.addFilter("duration", function (duration) {
      if (duration == null || isNaN(duration)) return '';
      if (duration < 1000) return duration.toFixed(0) + ' ms';
      if (duration < 60000) return (duration / 1000).toFixed(2) + ' s';
      const mins = Math.floor(duration / 60000);
      const secs = ((duration % 60000) / 1000).toFixed(0);
      return mins + ' m ' + secs + ' s';
    });
    return env.render("./spark.njk", { report: report });
  }
}

module.exports = NunjuckRender;
