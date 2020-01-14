// @flow
import React from "react";
import { FlatList, View, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "react-native-elements";
import CalendarPicker from "react-native-calendar-picker";
import moment from "moment";
import styles from "./PatientStyles";
import type { Patient } from "./Patient";
import type { Entry } from "../NewEntry/Entry";
import { scaleWidth, isTablet } from "../Helpers";

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
    this.setObservationDaysWithinMonth(moment());
    this.setObservationTimesWithinDay(moment());
  }

  setObservationDaysWithinMonth = async (date: moment) => {
    try {
      const { patient } = this.props;
      const response = await fetch(
        `https://vast-savannah-47684.herokuapp.com/patient/find-days-with-entries?id=${
          patient.id
        }&month=${date.month() + 1}&year=${date.year()}`
      );
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
    } catch (error) {
      this.setState({ isError: true, entryDates: [], selectedStartDate: date });
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
          comments: rawEntry.comments
        };
      });
      this.setState({
        isError: false,
        entryTimes: parsedEntries, // this needs to be a map from date to id
        observationIds,
        selectedStartDate: date
      });
    } catch (error) {
      this.setState({
        isError: true,
        entryTimes: [],
        observationIds: new Set(),
        selectedStartDate: date
      });
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
        style: { backgroundColor: "#ccffee" }
      });
    });

    const error = (
      <Text style={styles.errorText}>Could not retrieve old entries.</Text>
    );

    const data = [];
    const formattedDay = selectedStartDate.format("LL");
    observationIds.forEach(observation => {
      data.push({
        key: observation,
        isEntry: false,
        observationId: observation,
        rowTitle: "observation overview"
      });
    });
    entryTimes.forEach(entry => {
      const time = moment(entry.time).format("HH:mm A");
      data.push({
        key: entry.time,
        isEntry: true,
        entryData: entry,
        rowTitle: `${time} entry`
      });
    });

    let existingTimesList = null;
    existingTimesList = (
      <FlatList
        key="data"
        data={data}
        ItemSeparatorComponent={() => <View style={styles.entrySeparator} />}
        ListHeaderComponent={() => (
          <Text style={styles.entryHeader} key={formattedDay}>
            {formattedDay}
          </Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={
              item.isEntry
                ? () => this.navigateOldEntry(item.entryData)
                : () => this.navigateObservationOverview(item.observationId)
            }
          >
            <Text style={styles.entryLink}>{item.rowTitle}</Text>
          </TouchableOpacity>
        )}
      />
    );

    const calendar = (
      <View style={{ marginBottom: -32 }}>
        <CalendarPicker
          onDateChange={this.onDateChange}
          onMonthChange={this.onMonthChange}
          customDatesStyles={customDatesStyles}
          width={scaleWidth(isTablet() ? 0.64 : 0.9)}
        />
      </View>
    );

    const entries = (
      <View>
        <ScrollView style={{ flexGrow: 0 }}>{existingTimesList}</ScrollView>
      </View>
    );

    return (
      <View style={isTablet() ? styles.tabletCalendar : {}}>
        {isError ? error : calendar}
        {entries}
      </View>
    );
  }
}
