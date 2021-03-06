// @flow
import React from "react";
import { FlatList, View, TouchableOpacity } from "react-native";
import { Text } from "react-native-elements";
import CalendarPicker from "react-native-calendar-picker";
import { VictoryLegend } from "victory-native";
import moment from "moment";
import { RFValue } from "react-native-responsive-fontsize";
import styles from "./PatientStyles";
import type { Patient } from "./Patient";
import type { Entry } from "../NewEntry/Entry";
import { scaleWidth, isTablet } from "../Helpers";
import colours from "../Colours";

type Props = {
  patient: Patient,
  onNavigateOldEntry: (entry: Entry) => void,
  onNavigateObservationOverview: (observationId: string) => void
};

type State = {
  selectedStartDate: moment,
  entryDates: Array<moment>,
  entryTimes: Array<Entry>,
  observationIds: Set<string>,
  isError: boolean
};

export default class Calendar extends React.Component<Props, State> {
  _isMounted = false;

  constructor(props: Props) {
    super(props);
    const today = moment();
    this.state = {
      selectedStartDate: today,
      entryDates: [],
      entryTimes: [],
      observationIds: new Set(),
      isError: false
    };
  }

  async componentDidMount() {
    this._isMounted = true;
    this.setObservationDaysWithinMonth(moment());
    this.setObservationTimesWithinDay(moment());
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  setObservationDaysWithinMonth = async (date: moment) => {
    try {
      const { patient } = this.props;
      const response = await fetch(
        `https://vast-savannah-47684.herokuapp.com/patient/find-days-with-entries?id=${
          patient.id
        }&month=${date.month() + 1}&year=${date.year()}`
      );
      if (this._isMounted) {
        if (!response.ok) {
          this.setState({
            isError: true,
            entryDates: [],
            selectedStartDate: date
          });
        }
        const json = await response.json();
        this.setState({
          isError: false,
          entryDates: json,
          selectedStartDate: date
        });
      }
    } catch (error) {
      if (this._isMounted) {
        this.setState({
          isError: true,
          entryDates: [],
          selectedStartDate: date
        });
      }
    }
  };

  setObservationTimesWithinDay = async (date: moment) => {
    try {
      const { patient } = this.props;
      const response = await fetch(
        `https://vast-savannah-47684.herokuapp.com/entry/find-entries-on-day?id=${
          patient.id
        }&month=${date.month() + 1}&year=${date.year()}&day=${date.date()}`
      );
      if (this._isMounted) {
        if (!response.ok) {
          this.setState({
            isError: true,
            entryTimes: [],
            observationIds: new Set(),
            selectedStartDate: date
          });
        }
        const json = await response.json();
        const observationIds = new Set();
        const parsedEntries = json.map(rawEntry => {
          observationIds.add(rawEntry.observation_ID);
          return {
            locations: rawEntry.locations,
            contexts: rawEntry.contexts,
            behaviours: rawEntry.behaviours,
            time: rawEntry.time,
            comments: rawEntry.comments,
            personalized_behaviour_1_title:
              rawEntry.personalized_behaviour_1_title,
            personalized_behaviour_2_title:
              rawEntry.personalized_behaviour_2_title,
            personalized_context_1_title: rawEntry.personalized_context_1_title,
            personalized_context_2_title: rawEntry.personalized_context_2_title
          };
        });
        this.setState({
          isError: false,
          entryTimes: parsedEntries, // this needs to be a map from date to id
          observationIds,
          selectedStartDate: date
        });
      }
    } catch (error) {
      if (this._isMounted) {
        this.setState({
          isError: true,
          entryTimes: [],
          observationIds: new Set(),
          selectedStartDate: date
        });
      }
    }
  };

  onDateChange = (date: moment) => {
    this.setObservationTimesWithinDay(date);
  };

  onMonthChange = (date: moment) => {
    this.setObservationDaysWithinMonth(date);
    this.setObservationTimesWithinDay(date); // select first day in month
  };

  navigateOldEntry = (entry: Entry) => {
    const { onNavigateOldEntry } = this.props;
    onNavigateOldEntry(entry);
  };

  navigateObservationOverview = (observationId: string) => {
    const { onNavigateObservationOverview } = this.props;
    onNavigateObservationOverview(observationId);
  };

  render() {
    const {
      selectedStartDate,
      entryDates,
      entryTimes,
      observationIds,
      isError
    } = this.state;
    const customDatesStyles = [];
    entryDates.forEach(day => {
      const date = moment();
      customDatesStyles.push({
        date: date.set({
          year: selectedStartDate.year(),
          month: selectedStartDate.month(),
          date: day
        }),
        style: { backgroundColor: colours.backupBlue }
      });
    });

    if (isError) {
      return (
        <Text style={styles.errorText}>Could not retrieve old entries.</Text>
      );
    }

    const formattedDay = selectedStartDate.format("LL");
    const header = [];
    header.push(
      <Text style={styles.entryHeader} key={formattedDay}>
        {formattedDay}
      </Text>
    );
    observationIds.forEach(observation => {
      header.push(
        <TouchableOpacity
          style={styles.entryItem}
          onPress={() => this.navigateObservationOverview(observation)}
          key={observation}
        >
          <Text style={styles.entryLink}>View Observation Overview</Text>
        </TouchableOpacity>
      );
    });
    const data = [];
    entryTimes.forEach(entry => {
      const time = moment(entry.time).format("h:mm A");
      data.push({
        key: entry.time,
        entryData: entry,
        rowTitle: `${time} Entry`
      });
    });

    let existingTimesList = null;
    existingTimesList = (
      <FlatList
        key="data"
        data={data}
        horizontal={false}
        numColumns={isTablet() ? 3 : 2}
        ItemSeparatorComponent={() => <View style={styles.entrySeparator} />}
        ListHeaderComponent={() => <View>{header}</View>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.entryItem}
            onPress={() => this.navigateOldEntry(item.entryData)}
          >
            <Text style={styles.entryLink}>{item.rowTitle}</Text>
          </TouchableOpacity>
        )}
      />
    );

    const calendar = (
      <View style={{ marginBottom: -48 }}>
        <CalendarPicker
          onDateChange={this.onDateChange}
          onMonthChange={this.onMonthChange}
          customDatesStyles={customDatesStyles}
          selectedDayColor={colours.backgroundBlue}
          todayBackgroundColor={colours.secondaryGrey}
          width={scaleWidth(isTablet() ? 0.64 : 0.9)}
        />
      </View>
    );

    const legendData = [
      { name: "Today", symbol: { fill: colours.secondaryGrey } },
      { name: "Day contains entries", symbol: { fill: colours.backupBlue } },
      { name: "Selected day", symbol: { fill: colours.backgroundBlue } }
    ];

    const entries = <View>{existingTimesList}</View>;

    const legend = (
      <View
        pointerEvents="none"
        style={{ marginBottom: isTablet() ? 0 : -200 }}
      >
        <VictoryLegend
          x={24}
          y={24}
          data={legendData}
          gutter={isTablet() ? 20 : 4}
          symbolSpacer={isTablet() ? 12 : 8}
          padding={{ bottom: 0 }}
          style={{
            labels: {
              fontSize: RFValue(14),
              fontFamily: "Arial"
            }
          }}
          orientation="vertical"
        />
      </View>
    );

    return (
      <View style={{ paddingBottom: 12 }}>
        <View style={isTablet() ? styles.tabletCalendar : {}}>
          {calendar}
          {legend}
        </View>
        {data.length > 0 ? entries : null}
      </View>
    );
  }
}
