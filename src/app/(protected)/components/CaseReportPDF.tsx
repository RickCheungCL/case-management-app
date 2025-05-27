
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11 },
  heading: { fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
  section: { marginBottom: 12 },
  subheading: { fontSize: 14, marginBottom: 6, fontWeight: 'bold' },
  label: { fontWeight: 'bold' },
  item: { marginBottom: 4 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default function CaseReportPDF({ caseData }: { caseData: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.section}>
          <Text style={styles.heading}>Lighting Case Report</Text>
          <Text>Case ID: {caseData.id}</Text>
          <Text>Customer: {caseData.customerName}</Text>
          <Text>School: {caseData.schoolName}</Text>
          <Text>Contact: {caseData.contactPerson}</Text>
          <Text>Email: {caseData.emailAddress}</Text>
          <Text>Phone: {caseData.phoneNumber}</Text>
          <Text>Address: {caseData.schoolAddress}</Text>
        </View>

        {/* Fixture Counts */}
        <View style={styles.section}>
          <Text style={styles.subheading}>Lighting Fixture Counts</Text>
          {caseData.fixtureCounts?.length ? (
            caseData.fixtureCounts.map((f: any, index: number) => (
              <View key={f.id} style={styles.item}>
                <Text>
                  {index + 1}. {f.fixtureType?.name || 'Unnamed'} — Quantity: {f.count}
                </Text>
                {f.fixtureType?.description && (
                  <Text style={{ fontSize: 10, color: '#555' }}>
                    Link: {f.fixtureType.description}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text>No fixture data.</Text>
          )}
        </View>

        {/* On-Site Rooms */}
        {caseData.onSiteVisit?.rooms?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subheading}>On-Site Rooms</Text>
            {caseData.onSiteVisit.rooms.map((room: any, idx: number) => (
              <View key={room.id} style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Room {idx + 1}: {room.locationTag?.name || 'Untitled'}</Text>
                <Text>Lighting Issue: {room.lightingIssue || 'N/A'}</Text>
                <Text>Customer Request: {room.customerRequest || 'N/A'}</Text>
                <Text>Ceiling Height: {room.ceilingHeight ?? 'N/A'} ft</Text>
                <Text>Motion Sensors: {room.motionSensorQty}</Text>
                <Text>Mounting Kits: {room.mountingKitQty}</Text>

                {/* Existing Lights */}
                <Text style={{ marginTop: 4, fontWeight: 'bold' }}>Existing Lights:</Text>
                {room.existingLights?.length ? (
                  room.existingLights.map((el: any, i: number) => (
                    <Text key={el.id}>
                      • {el.product?.name || 'Unknown'} — Qty: {el.quantity}, Wattage: {el.product?.wattage || '?'}W
                    </Text>
                  ))
                ) : (
                  <Text>None</Text>
                )}

                {/* Suggested Lights */}
                <Text style={{ marginTop: 4, fontWeight: 'bold' }}>Suggested Lights:</Text>
                {room.suggestedLights?.length ? (
                  room.suggestedLights.map((sl: any, i: number) => (
                    <Text key={sl.id}>
                      • Product ID: {sl.productId} — Qty: {sl.quantity}
                    </Text>
                  ))
                ) : (
                  <Text>None</Text>
                )}

                {/* Photo Tags */}
                <Text style={{ marginTop: 4, fontWeight: 'bold' }}>Photo Tags:</Text>
                {room.photos?.length ? (
                  room.photos.map((photo: any) => (
                    <View key={photo.id}>
                      <Text>• Photo: {photo.url.split('/').pop()}</Text>
                      <Text style={{ fontSize: 10 }}>
                        Tags: {photo.tags.map((t: any) => t.tag.name).join(', ') || 'None'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text>No photos uploaded.</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
