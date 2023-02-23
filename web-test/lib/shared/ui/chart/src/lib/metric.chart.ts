import * as Chart from 'chart.js';

Chart.controllers.metric = Chart.controllers.extend({
  // Create elements for each piece of data in the dataset. Store elements in an array on the dataset as dataset.metaData
  addElements: function () {},

  // Create a single element for the data at the given index and reset its state
  addElementAndReset: function (index) {},

  // Draw the representation of the dataset
  // @param ease : if specified, this number represents how far to transition elements. See the implementation of draw() in any of the provided controllers to see how this should be used
  draw: function (ease) {},

  // Remove hover styling from the given element
  removeHoverStyle: function (element) {},

  // Add hover styling to the given element
  setHoverStyle: function (element) {},

  // Update the elements in response to new data
  // @param reset : if true, put the elements into a reset state so they can animate to their final values
  update: function (reset) {}
});
